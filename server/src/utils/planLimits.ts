/** Free-plan caps — enforced on the server; do not rely on UI alone. */

export const FREE_BOARDROOM_AI_MESSAGES = 3

/** Normalized bank label for strategy allowlist (lowercase, single spaces). */
export function normalizeStrategyBankKey(bank: string): string {
  return String(bank ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Free accounts may only request strategy content for these firms (sample templates).
 * Must match the client’s sample list labels after normalization.
 */
export const FREE_PLAN_STRATEGY_BANK_KEYS = new Set(
  ['Lazard (Paris)', 'Rothschild & Co (London)', 'Goldman Sachs (M&A)'].map(normalizeStrategyBankKey),
)

export function isStrategyBankAllowedForFreePlan(bank: string): boolean {
  return FREE_PLAN_STRATEGY_BANK_KEYS.has(normalizeStrategyBankKey(bank))
}
