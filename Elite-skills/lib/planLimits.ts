/** Keep in sync with server `src/utils/planLimits.ts`. */

export const FREE_BOARDROOM_AI_MESSAGES = 3

/** Sample strategy firms for free accounts (labels must match server allowlist when normalized). */
export const SAMPLE_STRATEGY_BANKS = [
  'Lazard (Paris)',
  'Rothschild & Co (London)',
  'Goldman Sachs (M&A)',
] as const
