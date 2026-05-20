
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Applicants', value: 10000, color: '#525252' },
  { name: 'First Round', value: 1500, color: '#AA8C2C' },
  { name: 'Offers Given', value: 50, color: '#D4AF37' },
];

const maxValue = data[0]?.value ?? 10000;

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { name: string; value: number }; name?: string; value?: number }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item.payload?.name ?? item.name ?? '';
  const value = item.payload?.value ?? item.value ?? 0;
  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 shadow-lg">
      <div className="text-white text-sm font-medium">{name}</div>
      <div className="text-[#D4AF37] text-sm">Value: {value.toLocaleString()}</div>
    </div>
  );
}

/** Mobile funnel: tapered stages, readable figures, horizontal bars scaled to applicants. */
function FunnelChartMobile() {
  const stageMeta = [
    { sub: 'Pool' },
    { sub: '~15% advance' },
    { sub: '~3.3% of prior stage' },
  ] as const;

  return (
    <div className="flex flex-col gap-2.5">
      {data.map((row, i) => {
        const pct = Math.max((row.value / maxValue) * 100, row.value > 0 ? 4 : 0);
        const shellPct = 100 - i * 7;
        const isOffers = row.name === 'Offers Given';

        return (
          <div
            key={row.name}
            className="mx-auto w-full transition-[max-width] duration-300"
            style={{ maxWidth: `${shellPct}%` }}
          >
            <div className="rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 md:px-4 md:py-3">
              <div className="mb-1.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-gray-300">
                    {row.name}
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-widest text-gray-600">
                    {stageMeta[i]?.sub}
                  </div>
                </div>
                <span
                  className={`shrink-0 font-mono text-base font-bold tabular-nums leading-none md:text-lg ${isOffers ? 'text-elite-gold' : 'text-white'}`}
                >
                  {row.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10 md:h-3">
                <div
                  className="h-full min-w-[6px] rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: row.color,
                    boxShadow: '0 0 14px rgba(212,175,55,0.2)',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
      <p className="pt-0.5 text-center text-[9px] uppercase leading-snug tracking-widest text-elite-text-muted md:text-[10px]">
        Bar width = share of applicant pool · Numbers match desktop chart
      </p>
    </div>
  );
}

const FunnelChart: React.FC = () => {
  return (
    <>
      <div className="md:hidden">
        <FunnelChartMobile />
      </div>
      <div className="hidden h-[280px] w-full md:block lg:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 8, right: 24, left: 4, bottom: 8 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#A3A3A3"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={88}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={36}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

export default FunnelChart;
