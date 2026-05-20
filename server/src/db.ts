import mongoose from 'mongoose'

import { User } from './models/User.js'

export async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }

  await mongoose.connect(uri)

  try {
    const r = await User.collection.updateMany(
      { $or: [{ plan: { $exists: false } }, { plan: null }, { plan: '' }] },
      { $set: { plan: 'free' } },
    )
    if (r.modifiedCount > 0) {
      console.log(`[db] Defaulted plan=free for ${r.modifiedCount} user(s) missing plan`)
    }
  } catch (e) {
    console.warn('[db] plan backfill skipped:', e)
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
}
