
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Applicants', value: 10000, color: '#262626' },
  { name: 'First Round', value: 1500, color: '#AA8C2C' },
  { name: 'Offers Given', value: 50, color: '#D4AF37' },
];

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

const FunnelChart: React.FC = () => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#A3A3A3" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            content={<CustomTooltip />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FunnelChart;
