'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Users, Flame, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wine)]">
          <Flame className="h-5 w-5 text-[var(--gold)]" />
        </div>
        <div>
          <span className="font-bold text-[var(--wine)]">Lima&apos;s</span>
          <span className="ml-1 text-xs font-medium text-[var(--muted-foreground)]">Admin</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--wine)] text-white'
                  : 'text-[var(--foreground)] hover:bg-[var(--sidebar-accent)]'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao Site
        </Link>
      </div>
    </aside>
  )
}
