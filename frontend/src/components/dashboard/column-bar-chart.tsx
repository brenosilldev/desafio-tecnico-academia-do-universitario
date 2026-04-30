'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'

interface ColumnBarChartProps {
  todo: number
  inProgress: number
  done: number
}

const COLORS = ['#9CA3AF', '#F97316', '#22C55E']

export function ColumnBarChart({ todo, inProgress, done }: ColumnBarChartProps) {
  const data = [
    { name: 'A Fazer', value: todo },
    { name: 'Em Andamento', value: inProgress },
    { name: 'Concluído', value: done },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#F97316' }} />
        <h3 className="text-sm font-semibold text-gray-800">Cards por Coluna</h3>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                fontSize: '12px',
              }}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
