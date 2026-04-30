'use client'

import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { useTasks } from '@/context/tasks-context'
import { StatCard } from '@/components/dashboard/stat-card'
import { StatusDonutChart } from '@/components/dashboard/status-donut-chart'
import { ColumnBarChart } from '@/components/dashboard/column-bar-chart'
import { RecentCards } from '@/components/dashboard/recent-cards'

const STAGGER = 0.07

export default function DashboardPage() {
  const { tasks, stats } = useTasks()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start justify-between mb-6"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visão geral do progresso do board</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
          <Circle className="h-2 w-2 fill-green-500 text-green-500" />
          Atualizado em tempo real
        </span>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: STAGGER } },
          hidden: {},
        }}
      >
        {[
          {
            icon: <LayoutGrid className="h-4 w-4 text-gray-500" />,
            value: stats.total,
            label: 'Total de Cards',
            sublabel: 'No board',
            iconBgColor: '#F3F4F6',
          },
          {
            icon: <Clock className="h-4 w-4 text-blue-400" />,
            value: stats.todo,
            label: 'A Fazer',
            sublabel: 'Aguardando início',
            iconBgColor: '#EFF6FF',
          },
          {
            icon: <TrendingUp className="h-4 w-4 text-orange-400" />,
            value: stats.inProgress,
            label: 'Em Andamento',
            sublabel: 'Em progresso',
            iconBgColor: '#FFF7ED',
          },
          {
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
            value: stats.done,
            label: 'Concluídos',
            sublabel: `${stats.completionRate}% do total`,
            iconBgColor: '#F0FDF4',
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
            }}
          >
            <StatCard {...card} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <StatusDonutChart
          todo={stats.todo}
          inProgress={stats.inProgress}
          done={stats.done}
        />
        <ColumnBarChart
          todo={stats.todo}
          inProgress={stats.inProgress}
          done={stats.done}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="mb-4"
      >
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: '#F97316' }} />
              <h3 className="text-sm font-semibold text-gray-800">Taxa de Conclusão</h3>
            </div>
            <span className="text-lg font-bold text-gray-900">{stats.completionRate}%</span>
          </div>
          <div className="relative h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(to right, #F97316, #22C55E)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-400">{stats.done} concluídos</span>
            <span className="text-xs text-gray-400">{stats.total} total</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <RecentCards tasks={tasks} />
      </motion.div>
    </div>
  )
}
