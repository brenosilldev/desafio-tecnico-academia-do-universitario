import * as React from 'react'
import { cn } from '@/lib/utils'
import { TaskStatus, STATUS_CONFIG } from '@/types/task'

interface BadgeProps {
  status: TaskStatus
  className?: string
}

export function StatusBadge({ status, className }: BadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.badgeClass,
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.dotColor }}
      />
      {config.label}
    </span>
  )
}
