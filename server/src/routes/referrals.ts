import { Router } from 'express'
import type { Request, Response } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { ReferralPost } from '../models/ReferralPost.js'
import { escapeRegex } from '../utils/sanitize.js'

export const referralsRouter = Router()

referralsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const tag = String(req.query?.tag ?? '').trim().toLowerCase()
  const q = String(req.query?.q ?? '').trim().toLowerCase().slice(0, 100)
  const limit = Math.min(50, Math.max(1, Number(req.query?.limit ?? 20)))

  const filter: Record<string, unknown> = { status: 'open' }
  if (tag) filter.tags = tag
  if (q) {
    const safeQ = escapeRegex(q)
    filter.$or = [
      { company: { $regex: safeQ, $options: 'i' } },
      { roleTitle: { $regex: safeQ, $options: 'i' } },
      { description: { $regex: safeQ, $options: 'i' } },
    ]
  }

  const posts = await ReferralPost.find(filter).sort({ createdAt: -1 }).limit(limit)

  res.json({
    posts: posts.map((p) => ({
      id: String(p._id),
      authorUserId: String(p.authorUserId),
      company: p.company,
      roleTitle: p.roleTitle,
      location: p.location,
      jobLink: p.jobLink,
      referralType: p.referralType,
      description: p.description,
      tags: p.tags,
      questions: p.questions,
      status: p.status,
      createdAt: p.createdAt,
    })),
  })
})

referralsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const company = String(req.body?.company ?? '').trim()
  const roleTitle = String(req.body?.roleTitle ?? '').trim()
  const description = String(req.body?.description ?? '').trim()
  const location = String(req.body?.location ?? '').trim()
  const jobLink = String(req.body?.jobLink ?? '').trim()
  const referralType = String(req.body?.referralType ?? 'referral').trim()

  const tags = Array.isArray(req.body?.tags)
    ? req.body.tags.map((t: unknown) => String(t).trim().toLowerCase()).filter(Boolean)
    : []

  const questions = Array.isArray(req.body?.questions)
    ? req.body.questions.map((t: unknown) => String(t).trim()).filter(Boolean)
    : []

  if (!company || !roleTitle || !description) {
    res.status(400).json({ error: 'company, roleTitle, description are required' })
    return
  }

  const post = await ReferralPost.create({
    authorUserId: req.userId,
    company,
    roleTitle,
    description,
    location,
    jobLink,
    referralType,
    tags,
    questions,
    status: 'open',
  })

  res.json({ id: String(post._id) })
})

referralsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const post = await ReferralPost.findById(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  res.json({
    post: {
      id: String(post._id),
      authorUserId: String(post.authorUserId),
      company: post.company,
      roleTitle: post.roleTitle,
      location: post.location,
      jobLink: post.jobLink,
      referralType: post.referralType,
      description: post.description,
      tags: post.tags,
      questions: post.questions,
      status: post.status,
      createdAt: post.createdAt,
    },
  })
})

referralsRouter.post('/:id/close', requireAuth, async (req: Request, res: Response) => {
  const post = await ReferralPost.findById(req.params.id)
  if (!post) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  if (String(post.authorUserId) !== String(req.userId)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  post.status = 'closed'
  await post.save()
  res.json({ ok: true })
})
