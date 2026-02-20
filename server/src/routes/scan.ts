import { Router } from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import pdf from 'pdf-parse'

import { requireAuth } from '../middleware/auth.js'
import { scoreResume } from '../utils/ats.js'
import { correctGrammar } from '../utils/grammar.js'
import { Scan } from '../models/Scan.js'

export const scanRouter = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

type MulterRequest = Request & { file?: Express.Multer.File }

scanRouter.post('/', requireAuth, upload.single('resume'), async (req: Request, res: Response) => {
  const jobDescription = String(req.body?.jobDescription ?? '')
  if (!jobDescription.trim()) {
    res.status(400).json({ error: 'jobDescription is required' })
    return
  }

  const file = (req as MulterRequest).file
  if (!file) {
    res.status(400).json({ error: 'resume PDF is required' })
    return
  }

  if (file.mimetype !== 'application/pdf') {
    res.status(400).json({ error: 'Only PDF files are supported' })
    return
  }

  const parsed = await pdf(file.buffer)
  const resumeText = String(parsed.text ?? '')

  const result = scoreResume(resumeText, jobDescription)
  const correctedResume = await correctGrammar(result.correctedResume)

  await Scan.create({
    userId: req.userId,
    jobDescription,
    resumeText,
    score: result.score,
    matchedKeywords: result.matchedKeywords,
    missingKeywords: result.missingKeywords,
    tips: result.tips,
  })

  res.json({
    score: result.score,
    matchedKeywords: result.matchedKeywords,
    missingKeywords: result.missingKeywords,
    tips: result.tips,
    sections: result.sections,
    resumeKeywords: result.resumeKeywords,
    jobKeywords: result.jobKeywords,
    correctedResume,
    suggestedAdditions: result.suggestedAdditions,
  })
})

scanRouter.get('/history', requireAuth, async (req: Request, res: Response) => {
  type ScanListItem = { _id: unknown; score: number; createdAt: Date }

  const scans = (await Scan.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select({ score: 1, createdAt: 1 })) as unknown as ScanListItem[]

  res.json({
    scans: scans.map((s) => ({ id: String(s._id), score: s.score, createdAt: s.createdAt })),
  })
})
