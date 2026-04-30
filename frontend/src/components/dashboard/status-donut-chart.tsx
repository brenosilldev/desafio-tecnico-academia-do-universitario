'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface StatusDonutChartProps {
  todo: number
  inProgress: number
  done: number
}

const COLORS = ['#9CA3AF', '#F97316', '#22C55E']

export function StatusDonutChart({ todo, inProgress, done }: StatusDonutChartProps) {
  const total = todo + inProgress + done
  const data = [
    { name: 'A Fazer', value: todo },
    { name: 'Em Andamento', value: inProgress },
    { name: 'Concluído', value: done },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#F97316' }} />
        <h3 className="text-sm font-semibold text-gray-800">Distribuição por Status</h3>
      </div>

      <div className="flex flex-col items-center">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, '']}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full space-y-2 mt-1">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-800">{entry.value}</span>
                <span className="text-xs text-gray-400 w-8 text-right">
                  {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
