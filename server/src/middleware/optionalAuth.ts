import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined

  if (!token) {
    next()
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    next()
    return
  }

  try {
    const payload = jwt.verify(token, secret) as { sub?: string }
    if (payload.sub) req.userId = payload.sub
  } catch {
    // ignore invalid token
  }
  next()
}
