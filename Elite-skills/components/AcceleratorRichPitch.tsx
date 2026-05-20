import { Link } from 'react-router-dom'

type AcceleratorRichPitchProps = {
  /** Extra classes for the wrapper (e.g. dark modal text colors) */
  className?: string
}

/**
 * Long-form Accelerator value + ROI copy (shared: Resume Creator, ATS paywall).
 */
export function AcceleratorRichPitch({ className }: AcceleratorRichPitchProps) {
  return (
    <div className={className}>
      <p style={{ margin: '0 0 16px' }}>
        <strong>Accelerator</strong> is the full stack: the tools that sit between you and the offer—not a single PDF export.
      </p>
      <p style={{ margin: '0 0 8px', color: 'var(--elite-gold, #d4af37)', fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        What you unlock
      </p>
      <ul style={{ margin: '0 0 20px', paddingLeft: 22 }}>
        <li style={{ marginBottom: 8 }}>
          <strong>Resume Creator</strong> — multiple templates, rich formatting, one-click PDF export from the profile you
          already maintain.
        </li>
        <li style={{ marginBottom: 8 }}>
          <strong>ATS Resume Checker</strong> — score against any job description, keyword gaps, section-level fixes, and saved
          scan history so you iterate like a process, not a guess.
        </li>
        <li style={{ marginBottom: 8 }}>
          <strong>Unlimited AI Boardroom</strong> — stress-test technical answers until they feel automatic.
        </li>
        <li style={{ marginBottom: 8 }}>
          <strong>Full Strategy Vault</strong> — every firm in the generator, not just the sample boutiques.
        </li>
        <li style={{ marginBottom: 0 }}>
          <strong>Accelerator resources</strong> — guides, structure, and support aligned with how recruiting actually works.
        </li>
      </ul>
      <p style={{ margin: '0 0 12px', color: 'var(--elite-gold, #d4af37)', fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        ROI (the part that sounds too good—then you do the math)
      </p>
      <p style={{ margin: 0 }}>
        One strong internship or full-time offer pays for this bundle many times over. The real return is also time: the hours
        you don&apos;t spend reformatting, re-reading job descriptions, or walking out of an interview wishing you&apos;d
        drilled harder. If Accelerator shaves even a handful of those hours—or gets you one more live process—it has already
        paid for itself. Your profile stays free to edit;{' '}
        <Link to="/profile/me" style={{ color: 'var(--elite-gold, #d4af37)' }}>
          keep it updated here
        </Link>
        , then upgrade when you&apos;re ready to ship like you mean it.
      </p>
    </div>
  )
}
