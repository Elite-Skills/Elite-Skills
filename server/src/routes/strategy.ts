import { Router, type Request, type Response } from 'express'
import { GoogleGenAI } from '@google/genai'

import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { isStrategyBankAllowedForFreePlan } from '../utils/planLimits.js'

async function getStrategyResponse(bank: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return "**The AI is taking a quick break.** It'll be back soon—try again in a moment!"
  }

  const ai = new GoogleGenAI({ apiKey })
  const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-flash']

  const systemInstruction = `
    You are a top Investment Banking Recruitment Consultant. 
    Provide 3 specific, tactical bullet points for an Elite Skills (ES) applicant at the selected firm. 
    Focus on the firm's culture (e.g., Lazard's intellectualism, Goldman's teamwork, Rothschild's family-owned advisory heritage), 
    typical interview style, and key technical focus areas. Professional, elite tone.
    
    Format your response with clear section titles in **bold** (e.g. **Culture & Fit:**, **Interview Style:**, **Technical Focus:**).
    Use double line breaks between paragraphs. Keep each section concise but substantive.
  `

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Provide a recruitment strategy for an internship at: ${bank}`,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        })
        const text = response.text
        if (text && !text.includes('Temporary service limit') && !text.includes('high demand')) {
          return text
        }
        throw new Error(text ?? 'Empty response')
      } catch (error: unknown) {
        const is429 =
          (error as { status?: number })?.status === 429 ||
          String(error).includes('429') ||
          String(error).includes('RESOURCE_EXHAUSTED')
        if (is429 && attempt < 2) {
          await sleep(45000)
          continue
        }
        console.error(`[Strategy] ${model} failed:`, (error instanceof Error ? error : new Error(String(error))).message.slice(0, 150))
        break
      }
    }
  }
  return "**The AI is taking a quick break.** It'll be back soon—try again in a moment!"
}

export const strategyRouter = Router()

strategyRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const { bank } = req.body as { bank?: string }

  if (typeof bank !== 'string' || !bank.trim()) {
    res.status(400).json({ error: 'Invalid request: bank required' })
    return
  }

  const trimmed = bank.trim()
  const user = await User.findById(req.userId).select({ plan: 1 })
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  if (user.plan !== 'paid' && !isStrategyBankAllowedForFreePlan(trimmed)) {
    res.status(403).json({
      error: 'free_plan_limit',
      code: 'strategy',
      message:
        'Sample strategy templates are included on the free tier. Upgrade to Accelerator for every firm, the ATS checker, resume creator, and unlimited boardroom simulations.',
    })
    return
  }

  const response = await getStrategyResponse(trimmed)
  res.json({ response })
})
