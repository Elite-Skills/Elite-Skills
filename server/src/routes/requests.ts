import { Router } from 'express'
import type { Request, Response } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { ConnectionRequest } from '../models/ConnectionRequest.js'
import { Connection } from '../models/Connection.js'
import { ReferralPost } from '../models/ReferralPost.js'
import { Profile } from '../models/Profile.js'
import { User } from '../models/User.js'
import type { Server } from 'socket.io'
import { createAndEmitNotification } from '../utils/notify.js'

export const requestsRouter = Router()

function getIo(req: Request): Server | undefined {
  return req.app.get('io') as Server | undefined
}

type QA = { question: string; answer: string }

function normalizeQA(input: unknown): QA[] {
  if (!Array.isArray(input)) return []
  return input
    .map((x) => x as any)
    .map((x) => ({ question: String(x?.question ?? '').trim(), answer: String(x?.answer ?? '').trim() }))
    .filter((x) => x.question && x.answer)
}

requestsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const postId = String(req.body?.postId ?? '').trim()
  const toUserIdRaw = String(req.body?.toUserId ?? '').trim()
  const questionAnswers = normalizeQA(req.body?.questionAnswers)

  let toUserId = toUserIdRaw
  let effectivePostId: string | undefined

  if (postId) {
    const post = await ReferralPost.findById(postId)
    if (!post) {
      res.status(404).json({ error: 'Referral post not found' })
      return
    }

    toUserId = String(post.authorUserId)
    effectivePostId = String(post._id)

    const requiredQuestions = post.questions
    for (const q of requiredQuestions) {
      if (!questionAnswers.some((qa) => qa.question === q && qa.answer.trim().length > 0)) {
        res.status(400).json({ error: 'All post questions must be answered' })
        return
      }
    }
  } else {
    if (!toUserId) {
      res.status(400).json({ error: 'toUserId or postId is required' })
      return
    }

    const profile = await Profile.findOne({ userId: toUserId })
    const required = profile?.connectionQuestions ?? []
    for (const q of required) {
      if (!questionAnswers.some((qa) => qa.question === q && qa.answer.trim().length > 0)) {
        res.status(400).json({ error: 'All profile questions must be answered' })
        return
      }
    }
  }

  if (String(toUserId) === String(req.userId)) {
    res.status(400).json({ error: 'Cannot request yourself' })
    return
  }

  const pendingFilter: any = {
    fromUserId: req.userId,
    toUserId,
    status: 'pending',
  }
  if (effectivePostId) pendingFilter.postId = effectivePostId

  const existingPending = await ConnectionRequest.findOne(pendingFilter).select({ _id: 1 })

  if (existingPending) {
    res.status(409).json({ error: 'Request already pending' })
    return
  }

  const request = await ConnectionRequest.create({
    postId: effectivePostId,
    fromUserId: req.userId,
    toUserId,
    questionAnswers,
    status: 'pending',
  })

  await createAndEmitNotification(getIo(req), {
    userId: String(toUserId),
    type: 'request_received',
    title: 'New connection request',
    body: 'You received a new request. Open Requests to review answers.',
    link: '/requests',
    meta: { requestId: String(request._id), fromUserId: String(req.userId), postId: effectivePostId ?? null },
  })

  res.json({ id: String(request._id) })
})

requestsRouter.get('/incoming', requireAuth, async (req: Request, res: Response) => {
  const requests = await ConnectionRequest.find({ toUserId: req.userId }).sort({ createdAt: -1 }).limit(50)

  const fromIds = Array.from(new Set(requests.map((r) => String(r.fromUserId))))
  const toIds = Array.from(new Set(requests.map((r) => String(r.toUserId))))
  const userIds = Array.from(new Set([...fromIds, ...toIds]))

  const users = await User.find({ _id: { $in: userIds } }).select({ name: 1 })
  const profiles = await Profile.find({ userId: { $in: userIds } }).select({ userId: 1, headline: 1 })
  const userMap = new Map(users.map((u) => [String(u._id), u]))
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]))

  res.json({
    requests: requests.map((r) => ({
      id: String(r._id),
      postId: r.postId ? String(r.postId) : null,
      fromUserId: String(r.fromUserId),
      toUserId: String(r.toUserId),
      fromUser: {
        id: String(r.fromUserId),
        name: userMap.get(String(r.fromUserId))?.name ?? '',
        headline: profileMap.get(String(r.fromUserId))?.headline ?? '',
      },
      toUser: {
        id: String(r.toUserId),
        name: userMap.get(String(r.toUserId))?.name ?? '',
        headline: profileMap.get(String(r.toUserId))?.headline ?? '',
      },
      status: r.status,
      questionAnswers: r.questionAnswers,
      createdAt: r.createdAt,
    })),
  })
})

requestsRouter.get('/outgoing', requireAuth, async (req: Request, res: Response) => {
  const requests = await ConnectionRequest.find({ fromUserId: req.userId }).sort({ createdAt: -1 }).limit(50)

  const fromIds = Array.from(new Set(requests.map((r) => String(r.fromUserId))))
  const toIds = Array.from(new Set(requests.map((r) => String(r.toUserId))))
  const userIds = Array.from(new Set([...fromIds, ...toIds]))

  const users = await User.find({ _id: { $in: userIds } }).select({ name: 1 })
  const profiles = await Profile.find({ userId: { $in: userIds } }).select({ userId: 1, headline: 1 })
  const userMap = new Map(users.map((u) => [String(u._id), u]))
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]))

  res.json({
    requests: requests.map((r) => ({
      id: String(r._id),
      postId: r.postId ? String(r.postId) : null,
      fromUserId: String(r.fromUserId),
      toUserId: String(r.toUserId),
      fromUser: {
        id: String(r.fromUserId),
        name: userMap.get(String(r.fromUserId))?.name ?? '',
        headline: profileMap.get(String(r.fromUserId))?.headline ?? '',
      },
      toUser: {
        id: String(r.toUserId),
        name: userMap.get(String(r.toUserId))?.name ?? '',
        headline: profileMap.get(String(r.toUserId))?.headline ?? '',
      },
      status: r.status,
      questionAnswers: r.questionAnswers,
      createdAt: r.createdAt,
    })),
  })
})

requestsRouter.post('/:id/accept', requireAuth, async (req: Request, res: Response) => {
  const r = await ConnectionRequest.findById(req.params.id)
  if (!r) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  if (String(r.toUserId) !== String(req.userId)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  if (r.status !== 'pending') {
    res.status(400).json({ error: 'Request is not pending' })
    return
  }

  r.status = 'accepted'
  await r.save()

  const a = String(r.fromUserId)
  const b = String(r.toUserId)

  const userAId = a < b ? a : b
  const userBId = a < b ? b : a

  const existing = await Connection.findOne({
    userAId,
    userBId,
  })

  if (!existing) {
    await Connection.create({ userAId, userBId, requestId: r._id })
  }

  await createAndEmitNotification(getIo(req), {
    userId: String(r.fromUserId),
    type: 'request_accepted',
    title: 'Request accepted',
    body: 'Your connection request was accepted. You can now chat.',
    link: '/connections',
    meta: { requestId: String(r._id), toUserId: String(r.toUserId) },
  })

  res.json({ ok: true })
})

requestsRouter.post('/:id/reject', requireAuth, async (req: Request, res: Response) => {
  const r = await ConnectionRequest.findById(req.params.id)
  if (!r) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  if (String(r.toUserId) !== String(req.userId)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  if (r.status !== 'pending') {
    res.status(400).json({ error: 'Request is not pending' })
    return
  }

  r.status = 'rejected'
  await r.save()

  await createAndEmitNotification(getIo(req), {
    userId: String(r.fromUserId),
    type: 'request_rejected',
    title: 'Request rejected',
    body: 'Your connection request was rejected.',
    link: '/requests',
    meta: { requestId: String(r._id), toUserId: String(r.toUserId) },
  })
  res.json({ ok: true })
})
