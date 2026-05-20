import type { Request, Response, NextFunction } from 'express'

import { User } from '../models/User.js'

const DEFAULT_MESSAGE =
  'This feature is included with Accelerator. Upgrade for the ATS resume checker, resume creator, unlimited AI boardroom simulations, and all strategy firms.'

type PaidPlanOptions = {
  code?: string
  message?: string
}

/**
 * Requires an authenticated user with `plan: 'paid'` (Accelerator).
 * Use after `requireAuth` so `req.userId` is set.
 */
export function requirePaidPlan(options?: PaidPlanOptions) {
  const code = options?.code ?? 'accelerator_feature'
  const message = options?.message ?? DEFAULT_MESSAGE

  return async function requirePaidPlanMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const doc = await User.findById(req.userId).select({ plan: 1 }).lean().exec()
    const user = doc as { plan?: string } | null
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (user.plan !== 'paid') {
      res.status(403).json({
        error: 'free_plan_limit',
        code,
        message,
      })
      return
    }

    next()
  }
}
