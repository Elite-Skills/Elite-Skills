import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET is not set' })
    return
  }

  try {
    const payload = jwt.verify(token, secret) as { sub?: string }
    if (!payload.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
