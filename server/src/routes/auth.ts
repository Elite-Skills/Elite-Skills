import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { User } from '../models/User.js'
import { RegistrationInvite } from '../models/RegistrationInvite.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { validateRegisterInput, validateLoginInput } from '../utils/sanitize.js'
import { generateInviteToken, hashInviteToken } from '../utils/inviteToken.js'
import { isInvitePlan, planLabel, type InvitePlan } from '../utils/planLimits.js'
import { isAdminEmail, serializeAuthUser } from '../utils/userPlan.js'

export const authRouter = Router()
export const adminRouter = Router()

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  return jwt.sign({}, secret, { subject: userId, expiresIn: '7d' })
}

function getClientOrigin(): string {
  const raw = String(process.env.CLIENT_ORIGIN ?? 'http://localhost:5173').split(',')[0]?.trim()
  return raw.replace(/\/+$/, '') || 'http://localhost:5173'
}

authRouter.get('/invite/:token', async (req: Request, res: Response) => {
  const token = String(req.params.token ?? '').trim()
  if (!token || token.length > 256) {
    res.status(400).json({ valid: false, error: 'Invalid link' })
    return
  }

  const inviteDoc = await RegistrationInvite.findOne({ tokenHash: hashInviteToken(token) }).lean().exec()
  const invite = inviteDoc as { usedAt?: Date | null; plan?: string } | null
  if (!invite || invite.usedAt) {
    res.status(404).json({ valid: false, error: 'Invalid link' })
    return
  }

  const plan = invite.plan as InvitePlan
  res.json({ valid: true, plan, planLabel: planLabel(plan) })
})

authRouter.post('/register', async (req: Request, res: Response) => {
  const inviteToken = String(req.body?.inviteToken ?? '').trim()
  if (!inviteToken) {
    res.status(403).json({ error: 'Invalid link' })
    return
  }

  const validated = validateRegisterInput(req.body)
  if ('error' in validated) {
    res.status(400).json({ error: validated.error })
    return
  }
  const { name, email, password } = validated

  const existing = await User.findOne({ email })
  if (existing) {
    res.status(409).json({ error: 'Email already in use' })
    return
  }

  const tokenHash = hashInviteToken(inviteToken)
  const invite = await RegistrationInvite.findOneAndUpdate(
    { tokenHash, usedAt: null },
    { $set: { usedAt: new Date() } },
    { new: false },
  )
  if (!invite) {
    res.status(403).json({ error: 'Invalid link' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const isAdmin = isAdminEmail(email)
  const plan = invite.plan

  let user
  try {
    user = await User.create({
      name,
      email,
      passwordHash,
      isAdmin,
      plan,
      registeredViaInviteId: invite._id,
    })
  } catch (err) {
    await RegistrationInvite.updateOne({ _id: invite._id }, { $set: { usedAt: null, usedByUserId: null } })
    throw err
  }

  await RegistrationInvite.updateOne({ _id: invite._id }, { $set: { usedByUserId: user._id } })

  const token = signToken(String(user._id))
  res.json({
    token,
    user: serializeAuthUser(user),
  })
})

authRouter.post('/login', async (req: Request, res: Response) => {
  const validated = validateLoginInput(req.body)
  if ('error' in validated) {
    res.status(400).json({ error: validated.error })
    return
  }
  const { email, password } = validated

  const user = await User.findOne({ email })
  if (!user) {
    res.status(401).json({ error: 'No account found with this email' })
    return
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'Incorrect password' })
    return
  }

  const token = signToken(String(user._id))
  res.json({
    token,
    user: serializeAuthUser(user),
  })
})

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.userId)
  if (!user) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  res.json({ user: serializeAuthUser(user) })
})

adminRouter.post('/invites', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  const planRaw = String(req.body?.plan ?? '').trim().toLowerCase()
  if (!isInvitePlan(planRaw)) {
    res.status(400).json({ error: 'plan must be one of: foundation, accelerator, elite' })
    return
  }

  const token = generateInviteToken()
  const invite = await RegistrationInvite.create({
    tokenHash: hashInviteToken(token),
    plan: planRaw,
    createdBy: req.userId,
  })

  const registrationUrl = `${getClientOrigin()}/register/${token}`
  res.status(201).json({
    invite: {
      id: String(invite._id),
      plan: planRaw,
      planLabel: planLabel(planRaw),
      registrationUrl,
      usedAt: null,
      createdAt: invite.createdAt,
    },
  })
})

adminRouter.get('/invites', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  const invites = await RegistrationInvite.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec()

  res.json({
    invites: invites.map((invite) => ({
      id: String(invite._id),
      plan: invite.plan,
      planLabel: planLabel(invite.plan as InvitePlan),
      usedAt: invite.usedAt ?? null,
      usedByUserId: invite.usedByUserId ? String(invite.usedByUserId) : null,
      createdAt: invite.createdAt,
    })),
  })
})
