import type { Metadata } from 'next'
import { TasksProvider } from '@/context/tasks-context'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Academia do Universitário',
  description: 'Plataforma de gestão de tarefas acadêmicas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <TasksProvider>{children}</TasksProvider>
      </body>
    </html>
  )
}
