import { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type RunwayTooltipProps = {
  active?: boolean
  payload?: Array<{ value?: unknown; payload?: { phase?: string; cumulativeK?: number } }>
  label?: string | number
}

function RunwayTooltip({ active, payload, label }: RunwayTooltipProps) {
  if (!active || !payload?.length) return null

  const first = payload[0]
  const point = first?.payload ?? {}
  const phase = point.phase ?? String(label ?? '')
  const rawK =
    typeof first?.value === 'number'
      ? first.value
      : typeof point.cumulativeK === 'number'
        ? point.cumulativeK
        : NaN
  const kThousands = Number.isFinite(rawK) ? rawK : 0

  return (
    <div className="pointer-events-none z-50 max-w-[min(calc(100vw-2rem),18rem)] rounded-md border border-white/15 bg-[#0f0f0f]/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
      <div className="font-medium capitalize tracking-wide text-zinc-300">After landing · {phase}</div>
      <div className="mt-1 tabular-nums text-[13px] font-semibold text-elite-gold">
        ~€{kThousands.toLocaleString(undefined, { maximumFractionDigits: 1 })}k cumulative{' '}
        <span className="font-normal text-zinc-500">(illustrative)</span>
      </div>
    </div>
  )
}

/**
 * ROI strip visuals: funnel pressure + differentiation copy + illustrative earning runway chart.
 */
export default function RoiSnackCharts() {
  const illustrativeRunway = useMemo(
    () => [
      { phase: 'M3', cumulativeK: 24 },
      { phase: 'M6', cumulativeK: 52 },
      { phase: 'M12', cumulativeK: 98 },
      { phase: 'M18', cumulativeK: 128 },
    ],
    [],
  )

  const peakEuros = illustrativeRunway[illustrativeRunway.length - 1]?.cumulativeK ?? 128
  const peakEurosFormatted = (peakEuros * 1000).toLocaleString()

  /** Tooltip portaled to document so ROI card borders / clipping don’t crop the hover UI. */
  const roiTooltipPortal = useMemo(() => (typeof document !== 'undefined' ? document.body : null), [])

  const pipelineVisual = [
    {
      label: 'Applicants',
      pct: '100%',
      pctNote: '~100%',
      count: '10k+',
      accent: false,
      hint: 'Wide top of funnel',
    },
    {
      label: 'In deep process ≈',
      pct: '15%',
      pctNote: '~15%',
      count: '~1.5k',
      accent: false,
      hint: 'Still many; already filtered',
    },
    {
      label: 'Offers ≈',
      pct: '0.55%',
      pctNote: '~0.55%',
      count: '~50',
      accent: true,
      hint: 'Seats splinter across boutiques',
    },
  ] as const

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 md:items-stretch">
      <div className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-elite-gray/90 p-3 shadow-inner sm:p-4 md:h-full md:min-h-0 md:p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-elite-gold">Applicants → seats</p>
        <p className="mb-3 text-[11px] leading-snug text-elite-text-muted sm:mb-4">
          Narrowing funnel: every stage punishes fluff.
        </p>
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 md:justify-start md:gap-4">
          {pipelineVisual.map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-wide text-elite-text-muted">
                <span className="min-w-0 leading-tight">{row.label}</span>
                <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  <span className="font-mono text-[13px] font-semibold tracking-tight text-white">{row.count}</span>
                  <span className="font-mono text-[9px] normal-case tracking-normal text-gray-500">{row.pctNote}</span>
                </span>
              </div>
              <div className="mb-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full min-w-[4px] rounded-full ${row.accent ? 'bg-elite-gold shadow-[0_0_12px_rgba(212,175,55,0.35)]' : 'bg-white/30'}`}
                  style={{ width: row.pct }}
                />
              </div>
              <p className="text-[10px] leading-snug text-gray-500">{row.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-elite-gray/90 p-3 shadow-inner sm:p-4 md:h-full md:min-h-0 md:p-5">
        <div className="flex min-h-0 flex-1 flex-col md:justify-between">
          <div>
            <p className="mb-2 shrink-0 text-[10px] font-bold uppercase tracking-[0.25em] text-elite-gold">
              What distinguishes you here
            </p>
            <p className="text-sm leading-relaxed text-elite-text-muted">
              Paper parity is table stakes. The filter is rehearsal under pressure. Elite Skills Accelerator stacks ATS scoring,
              vault, and infinite boardroom drills on{' '}
              <span className="text-white">the bar interviewers drill you against</span>
              . Compound reps steadily and skip the panic week before a Superday.
            </p>
          </div>
          <div className="mt-4 shrink-0 border-t border-white/10 pt-3 sm:mt-auto sm:pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-elite-gold">Scarcity · speed</p>
            <p className="text-[11px] leading-relaxed text-elite-text-muted">
              Offers spread thin across boutiques, yet seasons sprint through shortlists faster than spreadsheets turn. Accelerator
              is laid out so you bank crisp repetitions inside those narrowing windows, not after invites land with zero runway.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-[2] flex min-h-0 flex-col overflow-hidden rounded-xl border border-elite-gold/20 bg-gradient-to-b from-elite-gold/10 to-transparent p-3 sm:p-4 md:h-full md:min-h-0 md:p-5">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-elite-gold">
              Landing the seat · potential Y1 pay (€)
            </p>
            <p className="mb-2 text-[11px] leading-snug text-elite-text-muted sm:mb-3">
              When the process breaks your way after serious prep here, juniors in boutique IB often slot into envelopes like
              this (illustrative only, before tax and firm specifics).
            </p>
            <p className="mb-0.5 text-[10px] uppercase tracking-widest text-gray-500">Illustrative Y1 TC snapshot</p>
            <p className="font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              €{peakEurosFormatted}
            </p>
          </div>

          <div className="relative z-[1] mt-3 w-full sm:mt-4">
            <div className="relative h-[112px] w-full overflow-hidden rounded-lg border border-white/5 bg-black/20 sm:h-[148px] md:h-[160px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={illustrativeRunway}
                  margin={{ top: 6, right: 6, left: 8, bottom: 18 }}
                  style={{ outline: 'none' }}
                >
                  <defs>
                    <linearGradient id="roiTcFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="phase"
                    stroke="#52525b"
                    tick={{ fill: '#a1a1aa', fontSize: 9 }}
                    interval={0}
                    axisLine={{ stroke: '#3f3f46' }}
                    tickLine={false}
                    height={36}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{
                      fill: '#e4e4e7',
                      fontSize: 10,
                      fontWeight: 500,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                    tickFormatter={(v) => `${v}k €`}
                    width={54}
                    axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    domain={[0, (max: number) => Math.ceil(max * 1.12)]}
                  />
                  <Tooltip
                    portal={roiTooltipPortal}
                    wrapperStyle={{
                      outline: 'none',
                      pointerEvents: 'none',
                      zIndex: 10000,
                    }}
                    content={(tipProps) => <RunwayTooltip {...tipProps} />}
                    allowEscapeViewBox={{ x: true, y: true }}
                    cursor={{ stroke: 'rgba(212,175,55,0.45)', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeK"
                    name="€k cumulative"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    fill="url(#roiTcFill)"
                    dot={{ r: 2.5, fill: '#D4AF37', stroke: '#fafafa', strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
