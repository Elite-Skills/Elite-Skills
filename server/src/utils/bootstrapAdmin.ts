import bcrypt from 'bcryptjs'

import { User } from '../models/User.js'

function bootstrapEmail(): string {
  const direct = String(process.env.ADMIN_BOOTSTRAP_EMAIL ?? '').trim().toLowerCase()
  if (direct) return direct
  const fromList = String(process.env.ADMIN_EMAILS ?? '')
    .split(',')[0]
    ?.trim()
    .toLowerCase()
  return fromList ?? ''
}

export async function ensureBootstrapAdmin(): Promise<void> {
  const email = bootstrapEmail()
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD ?? '')
  if (!email || !password) return

  const existing = await User.findOne({ email })
  const passwordHash = await bcrypt.hash(password, 12)

  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      { $set: { isAdmin: true, passwordHash, plan: existing.plan ?? 'elite' } },
    )
    console.log(`[db] Ensured admin account for ${email}`)
    return
  }

  await User.create({
    name: 'Admin',
    email,
    passwordHash,
    isAdmin: true,
    plan: 'elite',
  })
  console.log(`[db] Created bootstrap admin account for ${email}`)
}
