'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Users, Flame, ChevronLeft, LogOut, Menu, X, Tag } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: Tag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login?admin=1')
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wine)]">
          <Flame className="h-5 w-5 text-[var(--gold)]" />
        </div>
        <div>
          <span className="font-bold text-[var(--wine)]">Melqui</span>
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
              onClick={() => setMobileOpen(false)}
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

      <div className="border-t border-[var(--border)] p-4 space-y-3">
        {user && (
          <div className="px-3 py-2 rounded-lg bg-[var(--secondary)]">
            <p className="text-xs text-[var(--muted-foreground)]">Logado como</p>
            <p className="text-sm font-medium text-[var(--foreground)] truncate">{user.email}</p>
          </div>
        )}
        <Link
          href="/"
          className="flex items-center gap-2 px-3 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Ver site
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 px-3 text-sm text-red-500 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden h-screen w-64 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="bg-[var(--background)] border-[var(--border)]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 z-50 h-full w-64 border-r border-[var(--border)] bg-[var(--sidebar)] md:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  )
}
