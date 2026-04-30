'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, PlusCircle, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Board', href: '/', icon: LayoutGrid },
  { label: 'Novo Card', href: '/novo-card', icon: PlusCircle },
  { label: 'Dashboard', href: '/dashboard', icon: BarChart2 },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-100 h-14 flex items-center px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: '#F97316' }}
          aria-label="Academia do Universitário"
        >
          AU
        </div>
        <span className="text-sm font-medium text-gray-800">Academia do universitário</span>
      </div>

      <nav className="flex items-center gap-1" aria-label="Navegação principal">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-orange-500'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="h-4 w-4"
                style={isActive ? { color: '#F97316' } : undefined}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
