/** Registration invite links expire 24 hours after creation. */

export const INVITE_TTL_MS = 24 * 60 * 60 * 1000

export function inviteExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITE_TTL_MS)
}

type InviteExpiryFields = {
  expiresAt?: Date | string | null
  createdAt?: Date | string | null
}

export function resolveInviteExpiresAt(invite: InviteExpiryFields): Date | null {
  if (invite.expiresAt) {
    const d = new Date(invite.expiresAt)
    if (!Number.isNaN(d.getTime())) return d
  }
  if (invite.createdAt) {
    const created = new Date(invite.createdAt)
    if (!Number.isNaN(created.getTime())) return inviteExpiresAt(created)
  }
  return null
}

export function isInviteExpired(invite: InviteExpiryFields, now: Date = new Date()): boolean {
  const expiresAt = resolveInviteExpiresAt(invite)
  if (!expiresAt) return true
  return expiresAt.getTime() <= now.getTime()
}

export function inviteStatus(invite: InviteExpiryFields & { usedAt?: Date | string | null }): 'unused' | 'used' | 'expired' {
  if (invite.usedAt) return 'used'
  if (isInviteExpired(invite)) return 'expired'
  return 'unused'
}
