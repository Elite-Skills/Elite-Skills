/** Keep in sync with server `src/utils/planLimits.ts`. */

export type PlanTier = 'foundation' | 'accelerator' | 'elite'

export const PLAN_LABELS: Record<PlanTier, string> = {
  foundation: 'Foundation Pack',
  accelerator: 'Accelerator Pack',
  elite: 'Elite Pack',
}

export const FREE_BOARDROOM_AI_MESSAGES = 3

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

export function planHasAllStrategyBanks(plan: PlanTier): boolean {
  return plan === 'accelerator' || plan === 'elite'
}

/** Sample strategy firms for foundation accounts (labels must match server allowlist when normalized). */
export const SAMPLE_STRATEGY_BANKS = [
  'Lazard (Paris)',
  'Rothschild & Co (London)',
  'Goldman Sachs (M&A)',
] as const

export const INVITE_PLAN_OPTIONS = [
  { value: 'foundation' as const, label: 'Foundation Pack' },
  { value: 'accelerator' as const, label: 'Accelerator Pack' },
  { value: 'elite' as const, label: 'Elite Pack' },
]
