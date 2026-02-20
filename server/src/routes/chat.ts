import { Router } from 'express'
import type { Request, Response } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { ChatMessage } from '../models/ChatMessage.js'
import { getConnectionIfMember } from '../utils/connections.js'

export const chatRouter = Router()

chatRouter.get('/:connectionId/messages', requireAuth, async (req: Request, res: Response) => {
  const connectionId = String(req.params.connectionId)
  const limit = Math.min(100, Math.max(1, Number(req.query?.limit ?? 50)))

  const connection = await getConnectionIfMember(String(req.userId), connectionId)
  if (!connection) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const messages = await ChatMessage.find({ connectionId: connection._id })
    .sort({ createdAt: -1 })
    .limit(limit)

  res.json({
    messages: messages
      .map((m) => ({
        id: String(m._id),
        connectionId: String(m.connectionId),
        fromUserId: String(m.fromUserId),
        text: m.text,
        createdAt: m.createdAt,
      }))
      .reverse(),
  })
})
