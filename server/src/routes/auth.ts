import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { User } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { validateRegisterInput, validateLoginInput } from '../utils/sanitize.js'

export const authRouter = Router()

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set')
  }

  return jwt.sign({}, secret, { subject: userId, expiresIn: '7d' })
}

authRouter.post('/register', async (req: Request, res: Response) => {
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

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await User.create({ name, email, passwordHash })

  const token = signToken(String(user._id))
  res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } })
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
  res.json({ token, user: { id: String(user._id), name: user.name, email: user.email } })
})

authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await User.findById(req.userId)
  if (!user) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  res.json({ user: { id: String(user._id), name: user.name, email: user.email } })
})
