import { Router } from 'express'
import type { Request, Response } from 'express'
import type { Server } from 'socket.io'

import { requireAuth } from '../middleware/auth.js'
import { Notification } from '../models/Notification.js'

export const notificationsRouter = Router()

function getIo(req: Request): Server | undefined {
  return req.app.get('io') as Server | undefined
}

notificationsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  const unreadOnly = String(req.query?.unreadOnly ?? '').toLowerCase() === 'true'
  const limit = Math.min(100, Math.max(1, Number(req.query?.limit ?? 30)))

  const filter: any = { userId: req.userId }
  if (unreadOnly) filter.readAt = null

  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit)

  res.json({
    notifications: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      meta: n.meta,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  })
})

notificationsRouter.get('/unread-count', requireAuth, async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({ userId: req.userId, readAt: null })
  res.json({ count })
})

notificationsRouter.post('/:id/read', requireAuth, async (req: Request, res: Response) => {
  const n = await Notification.findById(req.params.id)
  if (!n) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  if (String(n.userId) !== String(req.userId)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  if (!n.readAt) {
    n.readAt = new Date()
    await n.save()

    const io = getIo(req)
    io?.to(`user:${String(req.userId)}`).emit('notify:read', { id: String(n._id) })
  }

  res.json({ ok: true })
})

notificationsRouter.post('/read-all', requireAuth, async (req: Request, res: Response) => {
  await Notification.updateMany({ userId: req.userId, readAt: null }, { $set: { readAt: new Date() } })

  const io = getIo(req)
  io?.to(`user:${String(req.userId)}`).emit('notify:read-all', { ok: true })

  res.json({ ok: true })
})
