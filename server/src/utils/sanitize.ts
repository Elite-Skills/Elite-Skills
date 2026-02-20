/**
 * Escape special regex characters to prevent ReDoS and regex injection.
 * Use when passing user input to MongoDB $regex.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MAX_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 128
const MIN_PASSWORD_LENGTH = 6

/** Reject strings that could be used for injection (null bytes, operator-like patterns) */
function hasDangerousChars(str: string): boolean {
  return /[\x00]/.test(str) || str.includes('$') || str.includes('..')
}

export function validateRegisterInput(body: {
  name?: unknown
  email?: unknown
  password?: unknown
  passwordConfirm?: unknown
}): { name: string; email: string; password: string } | { error: string } {
  const name = String(body?.name ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const passwordConfirm = String(body?.passwordConfirm ?? '')

  if (!name || !email || !password) {
    return { error: 'Missing fields' }
  }

  if (password !== passwordConfirm) {
    return { error: 'Passwords do not match' }
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { error: 'Name too long' }
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return { error: 'Email too long' }
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: 'Password must be at least 6 characters' }
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: 'Password too long' }
  }

  if (hasDangerousChars(name) || hasDangerousChars(email)) {
    return { error: 'Invalid characters in input' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email format' }
  }

  return { name, email, password }
}

export function validateLoginInput(body: { email?: unknown; password?: unknown }): { email: string; password: string } | { error: string } {
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!email || !password) {
    return { error: 'Missing fields' }
  }

  if (email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return { error: 'Invalid input' }
  }

  if (hasDangerousChars(email)) {
    return { error: 'Invalid characters in input' }
  }

  return { email, password }
}
