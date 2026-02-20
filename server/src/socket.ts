import jwt from 'jsonwebtoken'
import { Server, type Socket } from 'socket.io'

import { Connection } from './models/Connection.js'
import { ChatMessage } from './models/ChatMessage.js'
import { createAndEmitNotification } from './utils/notify.js'

type SocketAuthPayload = { token?: string }

type SocketUserData = { userId?: string }

type ChatJoinPayload = { connectionId: string }

type ChatSendPayload = { connectionId: string; text: string }

function userRoom(userId: string): string {
  return `user:${userId}`
}

function roomForConnection(connectionId: string): string {
  return `connection:${connectionId}`
}

async function connectionIfMember(userId: string, connectionId: string) {
  const conn = await Connection.findById(connectionId)
  if (!conn) return null
  const isMember = String(conn.userAId) === userId || String(conn.userBId) === userId
  if (!isMember) return null
  return conn
}

export function setupSocketIo(io: Server) {
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const auth = (socket.handshake.auth ?? {}) as SocketAuthPayload
    const token = typeof auth.token === 'string' ? auth.token : null
    if (!token) return next(new Error('Unauthorized'))

    const secret = process.env.JWT_SECRET
    if (!secret) return next(new Error('JWT_SECRET is not set'))

    try {
      const payload = jwt.verify(token, secret) as { sub?: string }
      if (!payload.sub) return next(new Error('Unauthorized'))
      ;(socket.data as SocketUserData).userId = payload.sub
      next()
    } catch {
      next(new Error('Unauthorized'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId = String((socket.data as SocketUserData).userId ?? '')

    if (userId) {
      socket.join(userRoom(userId))
    }

    socket.on('chat:join', async (payload: ChatJoinPayload, cb?: (x: { ok: boolean; error?: string }) => void) => {
      try {
        const connectionId = String(payload?.connectionId ?? '')
        if (!connectionId) {
          cb?.({ ok: false, error: 'connectionId is required' })
          return
        }

        const conn = await connectionIfMember(userId, connectionId)
        if (!conn) {
          cb?.({ ok: false, error: 'Forbidden' })
          return
        }

        socket.join(roomForConnection(String(conn._id)))
        cb?.({ ok: true })
      } catch {
        cb?.({ ok: false, error: 'Join failed' })
      }
    })

    socket.on('chat:send', async (payload: ChatSendPayload, cb?: (x: { ok: boolean; error?: string }) => void) => {
      try {
        const connectionId = String(payload?.connectionId ?? '')
        const text = String(payload?.text ?? '').trim()

        if (!connectionId || !text) {
          cb?.({ ok: false, error: 'connectionId and text are required' })
          return
        }

        const conn = await connectionIfMember(userId, connectionId)
        if (!conn) {
          cb?.({ ok: false, error: 'Forbidden' })
          return
        }

        const msg = await ChatMessage.create({
          connectionId: conn._id,
          fromUserId: userId,
          text,
        })

        io.to(roomForConnection(String(conn._id))).emit('chat:message', {
          id: String(msg._id),
          connectionId: String(msg.connectionId),
          fromUserId: String(msg.fromUserId),
          text: msg.text,
          createdAt: msg.createdAt,
        })

        const otherUserId = String(conn.userAId) === userId ? String(conn.userBId) : String(conn.userAId)
        if (otherUserId && otherUserId !== userId) {
          await createAndEmitNotification(io, {
            userId: otherUserId,
            type: 'chat_message',
            title: 'New message',
            body: msg.text.slice(0, 140),
            link: `/chat/${String(conn._id)}`,
            meta: { connectionId: String(conn._id), fromUserId: userId },
          })
        }

        cb?.({ ok: true })
      } catch {
        cb?.({ ok: false, error: 'Send failed' })
      }
    })
  })
}
