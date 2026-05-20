import { createHash } from 'node:crypto'
import type { Request } from 'express'
import mongoose from 'mongoose'

import { BoardroomIpLedger } from '../models/BoardroomIpLedger.js'
import { FREE_BOARDROOM_AI_MESSAGES } from './planLimits.js'

const GUEST_LIMIT = FREE_BOARDROOM_AI_MESSAGES

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress ?? 'unknown'
}

/** Stable per-network key (salt avoids trivial rainbow of raw IPs in a leak). */
export function boardroomClientKey(req: Request): string {
  const ip = getClientIp(req)
  const salt = process.env.BOARDROOM_IP_SALT ?? 'ib-bible-boardroom-ledger'
  return createHash('sha256').update(`${salt}:${ip}`, 'utf8').digest('hex')
}

export type GuestConsumeResult = 'ok' | 'guest_limit' | 'blocked_after_free'

/**
 * Atomically consume one guest slot if allowed. Retries briefly on concurrent updates.
 */
export async function tryConsumeGuestBoardroomSlot(ipHash: string): Promise<GuestConsumeResult> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let doc = await BoardroomIpLedger.findOne({ ipHash })
    if (!doc) {
      try {
        doc = await BoardroomIpLedger.create({ ipHash, guestCount: 0, exhaustedFreeUserIds: [] })
      } catch {
        continue
      }
    }

    const exhausted = doc.exhaustedFreeUserIds ?? []
    if (exhausted.length > 0) {
      return 'blocked_after_free'
    }
    if (doc.guestCount >= GUEST_LIMIT) {
      return 'guest_limit'
    }

    const updated = await BoardroomIpLedger.findOneAndUpdate(
      {
        _id: doc._id,
        guestCount: doc.guestCount,
        $or: [{ exhaustedFreeUserIds: { $exists: false } }, { exhaustedFreeUserIds: { $size: 0 } }],
      },
      { $inc: { guestCount: 1 } },
      { new: true },
    )

    if (updated) {
      return 'ok'
    }
  }

  return 'guest_limit'
}

/** Call when a free-plan user has no boardroom messages left (429 or last reply with 0 remaining). */
export async function markBoardroomFreeExhaustedForNetwork(ipHash: string, userId: string): Promise<void> {
  const oid = new mongoose.Types.ObjectId(userId)
  await BoardroomIpLedger.updateOne(
    { ipHash },
    {
      $addToSet: { exhaustedFreeUserIds: oid },
      $setOnInsert: { ipHash, guestCount: 0 },
    },
    { upsert: true },
  )
}
