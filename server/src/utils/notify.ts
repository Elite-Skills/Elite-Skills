import type { Server } from 'socket.io'

import { Notification } from '../models/Notification.js'

export type CreateNotificationInput = {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
  meta?: Record<string, unknown>
}

function userRoom(userId: string): string {
  return `user:${userId}`
}

export async function createNotification(input: CreateNotificationInput) {
  const doc = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? '',
    link: input.link ?? '',
    meta: input.meta ?? {},
    readAt: null,
  })

  return doc
}

export async function createAndEmitNotification(io: Server | undefined, input: CreateNotificationInput) {
  const doc = await createNotification(input)

  if (io) {
    io.to(userRoom(String(input.userId))).emit('notify:new', {
      id: String(doc._id),
      userId: String(doc.userId),
      type: doc.type,
      title: doc.title,
      body: doc.body,
      link: doc.link,
      meta: doc.meta,
      readAt: doc.readAt,
      createdAt: doc.createdAt,
    })
  }

  return doc
}
