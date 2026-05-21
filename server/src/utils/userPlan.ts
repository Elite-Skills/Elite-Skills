import { User } from '../models/User.js'
import {
  FREE_BOARDROOM_AI_MESSAGES,
  getPlanLimits,
  normalizePlanTier,
  type PlanTier,
  planHasAllStrategyBanks,
  planLabel,
} from './planLimits.js'

export type { PlanTier }
export { planLabel, normalizePlanTier, getPlanLimits, planHasAllStrategyBanks }

export type SerializedAuthUser = {
  id: string
  name: string
  email: string
  isAdmin: boolean
  canCreateReferral: boolean
  plan: PlanTier
  planLabel: string
  boardroomRemaining: number | null
  scansRemaining: number | null
  strategyRemaining: number | null
}

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean))
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails()
  if (adminEmails.size === 0) return false
  return adminEmails.has(email.trim().toLowerCase())
}

export function canCreateReferral(email: string): boolean {
  const adminEmails = getAdminEmails()
  if (adminEmails.size === 0) return true
  return adminEmails.has(email.trim().toLowerCase())
}

function remainingCount(limit: number | null, used: number): number | null {
  if (limit === null) return null
  return Math.max(0, limit - used)
}

export function serializeAuthUser(user: {
  _id: unknown
  name: string
  email: string
  isAdmin?: boolean
  plan?: string
  boardroomMessagesUsed?: number
  scansUsed?: number
  strategyRequestsUsed?: number
}): SerializedAuthUser {
  const plan = normalizePlanTier(user.plan)
  const limits = getPlanLimits(plan)
  const boardroomUsed = user.boardroomMessagesUsed ?? 0
  const scansUsed = user.scansUsed ?? 0
  const strategyUsed = user.strategyRequestsUsed ?? 0

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin === true || isAdminEmail(user.email),
    canCreateReferral: canCreateReferral(user.email),
    plan,
    planLabel: planLabel(plan),
    boardroomRemaining: remainingCount(limits.boardroomMessages, boardroomUsed),
    scansRemaining: remainingCount(limits.scans, scansUsed),
    strategyRemaining: remainingCount(limits.strategyRequests, strategyUsed),
  }
}

/** Legacy helper kept for boardroom guest messaging */
export { FREE_BOARDROOM_AI_MESSAGES }

export async function loadUserPlanFields(userId: string): Promise<{
  plan?: string
  boardroomMessagesUsed?: number
  scansUsed?: number
  strategyRequestsUsed?: number
} | null> {
  const doc = await User.findById(userId)
    .select({ plan: 1, boardroomMessagesUsed: 1, scansUsed: 1, strategyRequestsUsed: 1 })
    .lean()
    .exec()
  return doc as {
    plan?: string
    boardroomMessagesUsed?: number
    scansUsed?: number
    strategyRequestsUsed?: number
  } | null
}
