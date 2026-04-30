'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useTasks } from '@/context/tasks-context'
import { CreateCardForm } from '@/components/forms/create-card-form'

export default function NovoCardPage() {
  const router = useRouter()
  const { addTask } = useTasks()

  function handleSubmit(title: string, description: string) {
    addTask(title, description)
    router.push('/')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm mb-4 transition-colors"
          aria-label="Voltar ao board"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Criar novo card</h1>
        <p className="text-sm text-gray-400 mt-0.5">Preencha as informações abaixo</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <CreateCardForm onSubmit={handleSubmit} />
      </motion.div>
    </div>
  )
}
