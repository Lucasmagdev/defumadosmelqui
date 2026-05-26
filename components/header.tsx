'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Menu, Flame, User, LogOut, LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/store'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const navLinks = [
  { href: '/#cardapio', label: 'Cardápio' },
  { href: '/carrinho', label: 'Carrinho' },
  { href: '/meus-pedidos', label: 'Meus Pedidos' },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const itemCount = useCartStore((state) => state.getItemCount())
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isAdmin = user?.app_metadata?.role === 'admin'
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Conta'

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--wine)]">
            <Flame className="h-4 w-4 text-[var(--gold)]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-[var(--wine)]">Melqui Fumados</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--gold)]">Defumados Artesanais</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.filter((link) => link.href !== '/carrinho').map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--foreground)] transition-colors hover:text-[var(--wine)]"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/carrinho">
            <Button variant="outline" size="sm" className="relative gap-2 border-[var(--wine)] text-[var(--wine)] hover:bg-[var(--wine)] hover:text-white">
              <ShoppingCart className="h-4 w-4" />
              <span>Carrinho</span>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wine)] text-xs text-white"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-[var(--border)] text-[var(--foreground)] hover:border-[var(--wine)]">
                  <User className="mr-2 h-4 w-4" />
                  {displayName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[var(--card)] border-[var(--border)]">
                {isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--border)]" />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]">
                Entrar
              </Button>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          <Link href="/carrinho" aria-label="Abrir carrinho" className="relative rounded-full border border-[var(--border)] p-2">
            <ShoppingCart className="h-5 w-5 text-[var(--wine)]" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wine)] text-xs text-white">
                {itemCount}
              </span>
            )}
          </Link>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-[var(--background)]">
              <div className="flex flex-col gap-6 pt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-[var(--foreground)] transition-colors hover:text-[var(--wine)]"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--foreground)] hover:text-[var(--wine)]">
                        Admin
                      </Link>
                    )}
                    <button onClick={() => { handleLogout(); setIsOpen(false) }} className="text-left text-lg font-medium text-red-500 hover:text-red-400">
                      Sair
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-medium text-[var(--wine)]">
                    Entrar
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
