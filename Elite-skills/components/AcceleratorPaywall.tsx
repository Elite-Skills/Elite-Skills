import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AcceleratorPaywallProps = {
  title: string
  /** Shown under the title; defaults to a generic Accelerator pitch */
  description?: ReactNode
  /**
   * `rich` = wider card, left-aligned body (for long-form sell pages e.g. Resume Creator).
   */
  variant?: 'default' | 'rich'
}

/**
 * Shown when a free user opens an Accelerator-only route (client gate; server must enforce too).
 */
export default function AcceleratorPaywall({ title, description, variant = 'default' }: AcceleratorPaywallProps) {
  const isRich = variant === 'rich'
  return (
    <div className="page">
      <div
        className="card accelerator-paywall"
        style={{
          maxWidth: isRich ? 720 : 560,
          margin: '0 auto',
          textAlign: isRich ? 'left' : 'center',
        }}
      >
        <h2 style={{ marginBottom: isRich ? 16 : 12, textAlign: 'center' }}>{title}</h2>
        <div className="muted" style={{ marginBottom: 24, lineHeight: 1.65, fontSize: isRich ? 15 : undefined }}>
          {description ?? (
            <>
              This is included with <strong>Accelerator</strong>. Upgrade for the ATS checker, resume creator, unlimited AI
              boardroom simulations, and every strategy firm—not just the sample templates.
            </>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: isRich ? 'flex-start' : 'center',
          }}
        >
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center rounded-sm bg-elite-gold px-6 py-3 text-sm font-bold !text-black no-underline hover:bg-white hover:!text-black transition-colors"
          >
            View pricing
          </Link>
          <Link
            to="/boardroom"
            className="inline-flex items-center justify-center rounded-sm border border-white/20 bg-white/[0.07] px-6 py-3 text-sm font-semibold text-white no-underline shadow-[0_2px_12px_rgba(0,0,0,0.2)] hover:border-elite-gold/45 hover:bg-white/[0.1] transition-colors"
          >
            AI Boardroom (free tier)
          </Link>
        </div>
      </div>
    </div>
  )
}
