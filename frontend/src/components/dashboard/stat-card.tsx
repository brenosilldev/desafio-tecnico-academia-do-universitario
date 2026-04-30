import * as React from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ReactNode
  value: number
  label: string
  sublabel: string
  iconBgColor?: string
}

export function StatCard({ icon, value, label, sublabel, iconBgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBgColor ?? '#F3F4F6' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      </div>
    </div>
  )
}
