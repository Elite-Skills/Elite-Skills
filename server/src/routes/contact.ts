import { Router } from 'express'
import type { Request, Response } from 'express'

import { optionalAuth } from '../middleware/optionalAuth.js'
import { ContactSubmission } from '../models/ContactSubmission.js'

export const contactRouter = Router()

contactRouter.post('/', optionalAuth, async (req: Request, res: Response) => {
  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim()
  const message = String(req.body?.message ?? '').trim()

  if (!name || !email || !message) {
    res.status(400).json({ error: 'name, email, and message are required' })
    return
  }

  if (message.length > 5000) {
    res.status(400).json({ error: 'Message is too long' })
    return
  }

  await ContactSubmission.create({
    name,
    email,
    message,
    userId: req.userId ?? null,
  })

  res.json({ ok: true })
})
