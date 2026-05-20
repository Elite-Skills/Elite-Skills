import { Router } from 'express'
import type { Request, Response } from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import pdf from 'pdf-parse'

import { requireAuth } from '../middleware/auth.js'
import { requirePaidPlan } from '../middleware/requirePaidPlan.js'
import { scoreResume } from '../utils/ats.js'
import { correctGrammar } from '../utils/grammar.js'
import { Scan } from '../models/Scan.js'
import { sanitizePlainTextMultiline } from '../utils/sanitize.js'

export const scanRouter = Router()

const JOB_DESCRIPTION_MAX = 200_000

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

type MulterRequest = Request & { file?: Express.Multer.File }

const scanPaidOnly = requirePaidPlan({
  code: 'ats_checker',
  message:
    'The ATS Resume Checker is included with Accelerator. Upgrade to run unlimited scans, unlock the resume creator, and get full AI tooling.',
})

scanRouter.post('/', requireAuth, scanPaidOnly, upload.single('resume'), async (req: Request, res: Response) => {
  const jobDescription = sanitizePlainTextMultiline(String(req.body?.jobDescription ?? ''), JOB_DESCRIPTION_MAX)
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

  const apiResponse = {
    score: result.score,
    matchedKeywords: result.matchedKeywords,
    missingKeywords: result.missingKeywords,
    tips: result.tips,
    sections: result.sections,
    resumeKeywords: result.resumeKeywords,
    jobKeywords: result.jobKeywords,
    correctedResume,
    suggestedAdditions: result.suggestedAdditions,
  }

  await Scan.create({
    userId: req.userId,
    jobDescription,
    resumeText,
    score: result.score,
    matchedKeywords: result.matchedKeywords,
    missingKeywords: result.missingKeywords,
    tips: result.tips,
    fullResult: apiResponse,
  })

  res.json(apiResponse)
})

scanRouter.get('/history', requireAuth, scanPaidOnly, async (req: Request, res: Response) => {
  type ScanListItem = { _id: unknown; score: number; createdAt: Date }

  const scans = (await Scan.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select({ score: 1, createdAt: 1 })) as unknown as ScanListItem[]

  res.json({
    scans: scans.map((s) => ({ id: String(s._id), score: s.score, createdAt: s.createdAt })),
  })
})

scanRouter.get('/history/:scanId', requireAuth, scanPaidOnly, async (req: Request, res: Response) => {
  const { scanId } = req.params
  if (!mongoose.Types.ObjectId.isValid(scanId)) {
    res.status(400).json({ error: 'Invalid scan id' })
    return
  }

  const scan = await Scan.findOne({ _id: scanId, userId: req.userId })
    .lean()
    .exec()

  if (!scan) {
    res.status(404).json({ error: 'Scan not found' })
    return
  }

  const doc = scan as { fullResult?: Record<string, unknown> }
  const full = doc.fullResult
  if (!full || typeof full !== 'object') {
    res.status(404).json({
      error: 'This scan was saved before full results were stored. Run a new scan to see full feedback.',
    })
    return
  }

  res.json(full)
})
