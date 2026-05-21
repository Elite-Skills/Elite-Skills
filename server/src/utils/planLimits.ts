/** Plan caps — enforced on the server; do not rely on UI alone. */

export type PlanTier = 'foundation' | 'accelerator' | 'elite'

export type PlanLimits = {
  boardroomMessages: number | null
  scans: number | null
  strategyRequests: number | null
  allStrategyBanks: boolean
}

export const PLAN_LABELS: Record<PlanTier, string> = {
  foundation: 'Foundation Pack',
  accelerator: 'Accelerator Pack',
  elite: 'Elite Pack',
}

/** Legacy free-plan boardroom cap (guest trials + messaging). */
export const FREE_BOARDROOM_AI_MESSAGES = 3

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  foundation: {
    boardroomMessages: 10,
    scans: 5,
    strategyRequests: 15,
    allStrategyBanks: false,
  },
  accelerator: {
    boardroomMessages: 100,
    scans: 50,
    strategyRequests: 100,
    allStrategyBanks: true,
  },
  elite: {
    boardroomMessages: null,
    scans: null,
    strategyRequests: null,
    allStrategyBanks: true,
  },
}

export function normalizePlanTier(raw: string | undefined | null): PlanTier {
  const value = String(raw ?? '').trim().toLowerCase()
  if (value === 'accelerator' || value === 'paid') return 'accelerator'
  if (value === 'elite') return 'elite'
  if (value === 'foundation' || value === 'free') return 'foundation'
  return 'foundation'
}

export function planLabel(plan: PlanTier): string {
  return PLAN_LABELS[plan]
}

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function planHasAllStrategyBanks(plan: PlanTier): boolean {
  return getPlanLimits(plan).allStrategyBanks
}

/** Normalized bank label for strategy allowlist (lowercase, single spaces). */
export function normalizeStrategyBankKey(bank: string): string {
  return String(bank ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Foundation accounts may only request strategy content for these firms (sample templates).
 * Must match the client’s sample list labels after normalization.
 */
export const FOUNDATION_STRATEGY_BANK_KEYS = new Set(
  ['Lazard (Paris)', 'Rothschild & Co (London)', 'Goldman Sachs (M&A)'].map(normalizeStrategyBankKey),
)

export function isStrategyBankAllowedForPlan(plan: PlanTier, bank: string): boolean {
  if (planHasAllStrategyBanks(plan)) return true
  return FOUNDATION_STRATEGY_BANK_KEYS.has(normalizeStrategyBankKey(bank))
}

/** @deprecated Use isStrategyBankAllowedForPlan */
export function isStrategyBankAllowedForFreePlan(bank: string): boolean {
  return isStrategyBankAllowedForPlan('foundation', bank)
}

export const INVITE_PLAN_VALUES = ['foundation', 'accelerator', 'elite'] as const
export type InvitePlan = (typeof INVITE_PLAN_VALUES)[number]

export function isInvitePlan(value: string): value is InvitePlan {
  return (INVITE_PLAN_VALUES as readonly string[]).includes(value)
}
