import { Router, type Request, type Response } from 'express'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { GoogleGenAI } from '@google/genai'

const MESSAGE_LIMIT_GUEST = 5
const guestUsage = new Map<string, number>()

function getClientId(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress ?? 'unknown'
  return ip
}

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
    Then, ask one more deep-dive technical question about valuation (DCF/Comps), M&A math, or accounting (3-statement linking). 
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

  if (typeof userMessage !== 'string' || !userMessage.trim() || !Array.isArray(history)) {
    res.status(400).json({ error: 'Invalid request: userMessage and history required' })
    return
  }

  const isGuest = !req.userId
  if (isGuest) {
    const clientId = getClientId(req)
    const count = guestUsage.get(clientId) ?? 0
    if (count >= MESSAGE_LIMIT_GUEST) {
      res.status(429).json({
        error: 'limit_reached',
        message: `You've used your ${MESSAGE_LIMIT_GUEST} free messages. Log in for unlimited access.`,
      })
      return
    }
    guestUsage.set(clientId, count + 1)
  }

  const response = await getMDResponse(userMessage.trim(), history)
  res.json({ response })
})
