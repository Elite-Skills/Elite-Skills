import type { Request, Response, NextFunction } from 'express'
import { User } from '../models/User.js'

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean))
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const user = await User.findById(req.userId).select({ isAdmin: 1, email: 1 })
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  const u = user as { isAdmin?: boolean; email?: string }
  const adminEmails = getAdminEmails()
  const isAdmin = u.isAdmin === true || (u.email && adminEmails.has(u.email.trim().toLowerCase()))
  if (!isAdmin) {
    res.status(403).json({ error: 'Admin access required' })
    return
  }
  next()
}
