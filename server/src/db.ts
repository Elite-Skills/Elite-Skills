import mongoose from 'mongoose'

import { User } from './models/User.js'
import { RegistrationInvite } from './models/RegistrationInvite.js'
import { ensureBootstrapAdmin } from './utils/bootstrapAdmin.js'
import { inviteExpiresAt } from './utils/inviteExpiry.js'

export async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  await mongoose.connect(uri)

  try {
    const r = await User.collection.updateMany(
      { $or: [{ plan: { $exists: false } }, { plan: null }, { plan: '' }] },
      { $set: { plan: 'foundation' } },
    )
    if (r.modifiedCount > 0) {
      console.log(`[db] Defaulted plan=foundation for ${r.modifiedCount} user(s) missing plan`)
    }
  } catch (e) {
    console.warn('[db] plan backfill skipped:', e)
  }

  try {
    const legacyFree = await User.collection.updateMany({ plan: 'free' }, { $set: { plan: 'foundation' } })
    if (legacyFree.modifiedCount > 0) {
      console.log(`[db] Migrated plan free→foundation for ${legacyFree.modifiedCount} user(s)`)
    }
    const legacyPaid = await User.collection.updateMany({ plan: 'paid' }, { $set: { plan: 'accelerator' } })
    if (legacyPaid.modifiedCount > 0) {
      console.log(`[db] Migrated plan paid→accelerator for ${legacyPaid.modifiedCount} user(s)`)
    }
  } catch (e) {
    console.warn('[db] legacy plan migration skipped:', e)
  }

  try {
    const r2 = await User.collection.updateMany(
      { $or: [{ boardroomMessagesUsed: { $exists: false } }, { boardroomMessagesUsed: null }] },
      { $set: { boardroomMessagesUsed: 0 } },
    )
    if (r2.modifiedCount > 0) {
      console.log(`[db] Defaulted boardroomMessagesUsed=0 for ${r2.modifiedCount} user(s)`)
    }
  } catch (e) {
    console.warn('[db] boardroom usage backfill skipped:', e)
  }

  for (const field of ['scansUsed', 'strategyRequestsUsed'] as const) {
    try {
      const r = await User.collection.updateMany(
        { $or: [{ [field]: { $exists: false } }, { [field]: null }] },
        { $set: { [field]: 0 } },
      )
      if (r.modifiedCount > 0) {
        console.log(`[db] Defaulted ${field}=0 for ${r.modifiedCount} user(s)`)
      }
    } catch (e) {
      console.warn(`[db] ${field} backfill skipped:`, e)
    }
  }

  try {
    await ensureBootstrapAdmin()
  } catch (e) {
    console.warn('[db] admin bootstrap skipped:', e)
  }

  try {
    const missingExpiry = await RegistrationInvite.find({
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }],
    })
      .select({ createdAt: 1 })
      .lean()
      .exec()

    for (const invite of missingExpiry) {
      const created = invite.createdAt instanceof Date ? invite.createdAt : new Date()
      await RegistrationInvite.updateOne({ _id: invite._id }, { $set: { expiresAt: inviteExpiresAt(created) } })
    }
    if (missingExpiry.length > 0) {
      console.log(`[db] Backfilled expiresAt for ${missingExpiry.length} registration invite(s)`)
    }
  } catch (e) {
    console.warn('[db] invite expiry backfill skipped:', e)
  }
}
