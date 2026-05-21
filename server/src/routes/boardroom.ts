import { Router, type Request, type Response } from 'express'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { sanitizePlainTextMultiline } from '../utils/sanitize.js'
import { FREE_BOARDROOM_AI_MESSAGES, getPlanLimits } from '../utils/planLimits.js'
import { loadUserPlanFields, normalizePlanTier } from '../utils/userPlan.js'
import {
  boardroomClientKey,
  markBoardroomFreeExhaustedForNetwork,
  tryConsumeGuestBoardroomSlot,
} from '../utils/boardroomLedger.js'
import { User } from '../models/User.js'
import { GoogleGenAI } from '@google/genai'

const MESSAGE_LIMIT_GUEST = FREE_BOARDROOM_AI_MESSAGES
const BOARDROOM_MESSAGE_MAX = 12_000
const BOARDROOM_HISTORY_MAX_TURNS = 40
const BOARDROOM_HISTORY_TEXT_MAX = 32_000

async function getMDResponse(userMessage: string, history: { role: string; text: string }[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[Boardroom] GEMINI_API_KEY not set in env. Add it in Render → Environment.')
    return 'Your answer was insufficient. Try harder. (API temporarily unavailable—please try again.)'
  }

  const ai = new GoogleGenAI({ apiKey })
  const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-flash']

  const systemInstruction = `
    You are a hard-nosed Senior Managing Director at an elite investment bank (e.g., Goldman Sachs, Lazard, or Rothschild). 
    A candidate is answering a technical finance question. 
    Be brief, professional, and slightly critical. 
    Give them quick feedback on their answer (whether it was technically sound, too verbose, or lacked intuition).
    Then, ask one more deep-dive technical question about valuation (DCF/Comps), or accounting (3-statement linking). 
    Limit response to 2-3 sentences max. Maintain an elite, high-stakes persona.
  `

  const formattedHistory = history.map((h) => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }],
  }))

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Boardroom] Trying model=${model} attempt=${attempt}`)
        const response = await ai.models.generateContent({
          model,
          contents: [...formattedHistory, { role: 'user', parts: [{ text: userMessage }] }],
          config: {
            systemInstruction,
            temperature: 0.8,
          },
        })
        return response.text ?? "Your answer was insufficient. Try harder. (API temporarily unavailable—please try again.)"
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status
        const is429 = status === 429 || String(error).includes('429') || String(error).includes('RESOURCE_EXHAUSTED')
        if (is429 && attempt < 2) {
          console.log(`[Boardroom] ${model} 429, retry in 45s`)
          await sleep(45000)
          continue
        }
        console.error(`[Boardroom] ${model} failed:`, (error instanceof Error ? error : new Error(String(error))).message.slice(0, 200))
        break
      }
    }
  }
  return 'Your answer was insufficient. Try harder. (API temporarily unavailable—please try again.)'
}

export const boardroomRouter = Router()

boardroomRouter.post('/', optionalAuth, async (req: Request, res: Response) => {
  const { userMessage, history } = req.body as { userMessage?: string; history?: { role: string; text: string }[] }

  console.log('[Boardroom] Request received, hasKey:', Boolean(process.env.GEMINI_API_KEY), 'userId:', req.userId ?? 'guest')

  if (typeof userMessage !== 'string' || !Array.isArray(history)) {
    res.status(400).json({ error: 'Invalid request: userMessage and history required' })
    return
  }

  const cleanedMessage = sanitizePlainTextMultiline(userMessage, BOARDROOM_MESSAGE_MAX)
  if (!cleanedMessage) {
    res.status(400).json({ error: 'Invalid request: userMessage and history required' })
    return
  }

  const cleanedHistory = history
    .slice(-BOARDROOM_HISTORY_MAX_TURNS)
    .map((h: { role?: string; text?: string }) => {
      const roleRaw = String(h?.role ?? '').trim()
      const role = roleRaw === 'user' ? 'user' : 'model'
      const text = sanitizePlainTextMultiline(String(h?.text ?? ''), BOARDROOM_HISTORY_TEXT_MAX)
      return { role, text }
    })
    .filter((h: { text: string }) => h.text.length > 0)

  const isGuest = !req.userId
  let boardroomRemaining: number | null | undefined
  let authenticatedUserId: string | undefined
  const networkKey = boardroomClientKey(req)

  if (isGuest) {
    const guestResult = await tryConsumeGuestBoardroomSlot(networkKey)
    if (guestResult === 'guest_limit') {
      res.status(429).json({
        error: 'free_plan_limit',
        code: 'boardroom',
        message: `You've used your ${MESSAGE_LIMIT_GUEST} trial messages. Register with an invite link for more boardroom messages, or contact us to upgrade your plan.`,
      })
      return
    }
    if (guestResult === 'blocked_after_free') {
      res.status(429).json({
        error: 'free_plan_limit',
        code: 'boardroom',
        message: `Guest trials aren't available from this network after an account has used all boardroom messages. Sign in with that account, use another network, or contact us to upgrade.`,
      })
      return
    }
  } else {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    authenticatedUserId = userId
    const account = await loadUserPlanFields(userId)
    if (!account) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const plan = normalizePlanTier(account.plan)
    const limits = getPlanLimits(plan)
    const maxMessages = limits.boardroomMessages

    if (maxMessages !== null) {
      const reserved = await User.findOneAndUpdate(
        {
          _id: userId,
          boardroomMessagesUsed: { $lt: maxMessages },
        },
        { $inc: { boardroomMessagesUsed: 1 } },
        { new: true },
      )
      if (!reserved) {
        await markBoardroomFreeExhaustedForNetwork(networkKey, userId)
        res.status(429).json({
          error: 'plan_limit',
          code: 'boardroom',
          message: `Your ${plan} plan includes ${maxMessages} AI boardroom messages. Contact us to upgrade for more.`,
        })
        return
      }
      boardroomRemaining = Math.max(0, maxMessages - (reserved.boardroomMessagesUsed ?? 0))
    } else {
      boardroomRemaining = null
    }
  }

  const response = await getMDResponse(cleanedMessage, cleanedHistory)
  if (!isGuest && boardroomRemaining !== null && boardroomRemaining === 0 && authenticatedUserId) {
    await markBoardroomFreeExhaustedForNetwork(networkKey, authenticatedUserId)
  }
  const payload: { response: string; boardroomRemaining?: number | null } = { response }
  if (!isGuest) {
    payload.boardroomRemaining = boardroomRemaining
  }
  res.json(payload)
})
