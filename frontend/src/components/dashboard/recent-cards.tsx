import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Task } from '@/types/task'
import { StatusBadge } from '@/components/ui/badge'

interface RecentCardsProps {
  tasks: Task[]
}

export function RecentCards({ tasks }: RecentCardsProps) {
  const recent = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Cards recentes</h3>
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
        >
          Ver todos
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {recent.map((task) => (
          <div
            key={task.id}
            className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
            </div>
            <StatusBadge status={task.status} className="flex-shrink-0 mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}
