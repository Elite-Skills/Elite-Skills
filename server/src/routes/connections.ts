import { Router } from 'express'
import type { Request, Response } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { Connection } from '../models/Connection.js'
import { Profile } from '../models/Profile.js'
import { User } from '../models/User.js'

export const connectionsRouter = Router()

connectionsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.userId)
  const connections = await Connection.find({ $or: [{ userAId: userId }, { userBId: userId }] }).sort({ createdAt: -1 })

  const otherUserIds = connections
    .map((c) => (String(c.userAId) === userId ? String(c.userBId) : String(c.userAId)))
    .filter(Boolean)

  const users = await User.find({ _id: { $in: otherUserIds } }).select({ name: 1 })
  const userMap = new Map(users.map((u) => [String(u._id), u]))

  const profiles = await Profile.find({ userId: { $in: otherUserIds } }).select({ headline: 1, userId: 1 })
  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]))

  res.json({
    connections: connections.map((c) => {
      const otherUserId = String(c.userAId) === userId ? String(c.userBId) : String(c.userAId)
      const otherUser = userMap.get(otherUserId)
      const profile = profileMap.get(otherUserId)

      return {
        id: String(c._id),
        otherUser: {
          id: otherUserId,
          name: otherUser?.name ?? '',
          headline: profile?.headline ?? '',
        },
        createdAt: c.createdAt,
      }
    }),
  })
})

connectionsRouter.get('/:id/profile', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.userId)
  const connection = await Connection.findById(req.params.id)
  if (!connection) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const isMember = String(connection.userAId) === userId || String(connection.userBId) === userId
  if (!isMember) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const otherUserId = String(connection.userAId) === userId ? String(connection.userBId) : String(connection.userAId)
  const otherUser = await User.findById(otherUserId)
  if (!otherUser) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  const profile = await Profile.findOne({ userId: otherUserId })
  if (!profile) {
    res.json({ profile: { userId: otherUserId, name: otherUser.name, headline: '' } })
    return
  }

  const contact: any = {}
  if (profile.visibility.showEmail) contact.email = profile.contact.email
  if (profile.visibility.showPhone) contact.phone = profile.contact.phone
  if (profile.visibility.showLinkedIn) contact.linkedIn = profile.contact.linkedIn

  res.json({
    profile: {
      userId: otherUserId,
      name: otherUser.name,
      headline: profile.headline,
      experience: profile.experience,
      projects: profile.projects,
      contact,
      recommendations: profile.recommendations,
    },
  })
})
