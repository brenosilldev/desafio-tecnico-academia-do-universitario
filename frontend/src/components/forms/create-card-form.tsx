'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tag, AlignLeft, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const schema = z.object({
  title: z.string().min(1, 'O título é obrigatório.').max(100, 'Título muito longo.'),
  description: z
    .string()
    .min(1, 'A descrição é obrigatória.')
    .max(500, 'Descrição muito longa.'),
})

type FormData = z.infer<typeof schema>

interface CreateCardFormProps {
  onSubmit: (title: string, description: string) => void
}

export function CreateCardForm({ onSubmit }: CreateCardFormProps) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const description = watch('description', '')

  async function handleFormSubmit(data: FormData) {
    onSubmit(data.title, data.description)
    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-5">
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: '#FFF7ED' }}
        role="alert"
      >
        <div
          className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
          style={{ backgroundColor: '#F97316' }}
        >
          <LayoutGrid className="h-3 w-3 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F97316' }}>
            Status inicial: A Fazer
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#C2410C' }}>
            Todo card novo é criado automaticamente na coluna &ldquo;A Fazer&rdquo;. Você pode movê-lo depois.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              Título
              <span className="text-orange-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="Ex: Implementar autenticação OAuth"
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none transition-colors',
                errors.title
                  ? 'border-red-300 bg-red-50 focus:border-red-400'
                  : 'border-gray-200 bg-white focus:border-orange-400'
              )}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1.5 text-xs text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
              <AlignLeft className="h-3.5 w-3.5 text-gray-400" />
              Descrição
              <span className="text-orange-500">*</span>
            </label>
            <div className="relative">
              <textarea
                {...register('description')}
                placeholder="Descreva o que precisa ser feito, critérios de aceite, contexto relevante..."
                rows={5}
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 outline-none resize-none transition-colors',
                  errors.description
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : 'border-gray-200 bg-white focus:border-orange-400'
                )}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'desc-error' : undefined}
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-gray-300 pointer-events-none">
                {description?.length ?? 0} caracteres
              </span>
            </div>
            {errors.description && (
              <p id="desc-error" className="mt-1.5 text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={() => router.push('/')}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting}>
          <LayoutGrid className="h-4 w-4" />
          Criar card
        </Button>
      </div>
    </form>
  )
}
