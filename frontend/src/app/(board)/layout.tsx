import { Header } from '@/components/layout/header'

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  )
}
