import { Router } from 'express'
import type { Request, Response } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { User } from '../models/User.js'
import { Profile } from '../models/Profile.js'
import { areUsersConnected } from '../utils/connections.js'
import type { Server } from 'socket.io'
import { createAndEmitNotification } from '../utils/notify.js'

export const profileRouter = Router()

function getIo(req: Request): Server | undefined {
  return req.app.get('io') as Server | undefined
}

async function ensureProfile(userId: string) {
  let profile = await Profile.findOne({ userId })
  if (!profile) {
    profile = await Profile.create({ userId })
  }
  return profile
}

profileRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const profile = await ensureProfile(String(req.userId))
  const user = await User.findById(req.userId)

  res.json({
    profile: {
      userId: String(profile.userId),
      name: user?.name ?? '',
      headline: profile.headline,
      experience: profile.experience,
      projects: profile.projects,
      contact: profile.contact,
      visibility: profile.visibility,
      connectionQuestions: profile.connectionQuestions,
      recommendations: profile.recommendations,
    },
  })
})

profileRouter.put('/me', requireAuth, async (req: Request, res: Response) => {
  const headline = String(req.body?.headline ?? '').trim()
  const experience = Array.isArray(req.body?.experience) ? req.body.experience.map((s: unknown) => String(s)) : undefined
  const projects = Array.isArray(req.body?.projects) ? req.body.projects.map((s: unknown) => String(s)) : undefined

  const contact = req.body?.contact
  const visibility = req.body?.visibility

  const connectionQuestions = Array.isArray(req.body?.connectionQuestions)
    ? req.body.connectionQuestions.map((s: unknown) => String(s)).filter(Boolean)
    : undefined

  const profile = await ensureProfile(String(req.userId))

  if (headline !== undefined) profile.headline = headline
  if (experience) profile.experience = experience
  if (projects) profile.projects = projects
  if (connectionQuestions) profile.connectionQuestions = connectionQuestions

  if (contact && typeof contact === 'object') {
    profile.contact.email = String((contact as any).email ?? profile.contact.email)
    profile.contact.phone = String((contact as any).phone ?? profile.contact.phone)
    profile.contact.linkedIn = String((contact as any).linkedIn ?? profile.contact.linkedIn)
  }

  if (visibility && typeof visibility === 'object') {
    profile.visibility.showEmail = Boolean((visibility as any).showEmail)
    profile.visibility.showPhone = Boolean((visibility as any).showPhone)
    profile.visibility.showLinkedIn = Boolean((visibility as any).showLinkedIn)
  }

  await profile.save()

  res.json({ ok: true })
})

profileRouter.post('/:userId/recommend', requireAuth, async (req: Request, res: Response) => {
  const toUserId = String(req.params.userId)
  const text = String(req.body?.text ?? '').trim()

  if (!text) {
    res.status(400).json({ error: 'text is required' })
    return
  }

  const profile = await ensureProfile(toUserId)
  profile.recommendations.unshift({ authorUserId: req.userId, text, createdAt: new Date() })
  await profile.save()

  await createAndEmitNotification(getIo(req), {
    userId: toUserId,
    type: 'recommendation',
    title: 'New recommendation',
    body: text.slice(0, 140),
    link: `/profile/${toUserId}`,
    meta: { fromUserId: String(req.userId) },
  })

  res.json({ ok: true })
})

profileRouter.get('/:userId', requireAuth, async (req: Request, res: Response) => {
  const targetUserId = String(req.params.userId)

  const targetUser = await User.findById(targetUserId)
  if (!targetUser) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const profile = await ensureProfile(targetUserId)
  const connected = await areUsersConnected(String(req.userId), targetUserId)

  if (!connected && String(req.userId) !== targetUserId) {
    res.json({
      profile: {
        userId: targetUserId,
        name: targetUser.name,
        headline: profile.headline,
        connectionQuestions: profile.connectionQuestions,
        recommendations: profile.recommendations,
      },
    })
    return
  }

  const contact: any = {}
  if (profile.visibility.showEmail) contact.email = profile.contact.email
  if (profile.visibility.showPhone) contact.phone = profile.contact.phone
  if (profile.visibility.showLinkedIn) contact.linkedIn = profile.contact.linkedIn

  res.json({
    profile: {
      userId: targetUserId,
      name: targetUser.name,
      headline: profile.headline,
      experience: profile.experience,
      projects: profile.projects,
      contact,
      recommendations: profile.recommendations,
      connected,
    },
  })
})
