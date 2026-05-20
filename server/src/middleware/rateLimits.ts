import rateLimit from 'express-rate-limit'

const json429 = { error: 'Too many requests. Please try again later.' }

/** Heavy POST endpoints (AI, uploads) — limit writes only so GET/list stays usable. */
export function postOnlyLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: json429,
    skip: (req) => req.method !== 'POST',
  })
}

/** Boardroom chat (Gemini) — all routes are POST today */
export const boardroomLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 45,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many boardroom messages. Please wait a minute.' },
})

/** Resume scan upload + scoring */
export const scanPostLimiter = postOnlyLimiter(15 * 60 * 1000, 24)

/** Strategy bank POST */
export const strategyPostLimiter = postOnlyLimiter(15 * 60 * 1000, 40)

/** Contact form */
export const contactPostLimiter = postOnlyLimiter(60 * 60 * 1000, 12)

/** Referral create / updates (non-GET) */
export const referralWriteLimiter = postOnlyLimiter(60 * 60 * 1000, 40)

/** Connection requests (create, accept, reject) */
export const requestWriteLimiter = postOnlyLimiter(60 * 60 * 1000, 80)
