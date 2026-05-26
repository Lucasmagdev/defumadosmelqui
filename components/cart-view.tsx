'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

export function CartView() {
  const { items, removeItem, updateQuantity, updateObservations, getTotal } = useCartStore()
  const total = getTotal()

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center justify-center py-16"
      >
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--secondary)]">
          <ShoppingBag className="h-12 w-12 text-[var(--muted-foreground)]" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          Seu carrinho está vazio
        </h2>
        <p className="mb-6 text-center text-[var(--muted-foreground)]">
          Explore nosso cardápio e adicione deliciosas carnes defumadas!
        </p>
        <Link href="/">
          <Button className="bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]">
            Ver Cardápio
          </Button>
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.div
              key={item.product.id}
              layout
              initial={{ opacity: 0, x: -24 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.25 } }}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
            >
              <div className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)]">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {formatCurrency(item.product.price)} cada
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.82 }}
                        onClick={() => removeItem(item.product.id)}
                        className="rounded-full p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.78 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] hover:border-[var(--wine)] hover:text-[var(--wine)]"
                        onClick={() =>
                          updateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </motion.button>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 1.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="w-8 text-center font-medium"
                      >
                        {item.quantity}
                      </motion.span>
                      <motion.button
                        whileTap={{ scale: 0.78 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </motion.button>
                      <motion.span
                        key={`${item.product.id}-${item.quantity}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-auto font-bold text-[var(--wine)]"
                      >
                        {formatCurrency(item.product.price * item.quantity)}
                      </motion.span>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="Observações (ex: sem cebola, sem milho...)"
                    value={item.observations}
                    onChange={(e) => updateObservations(item.product.id, e.target.value)}
                    className="min-h-[60px] border-[var(--border)] bg-[var(--background)] text-sm"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Separator className="bg-[var(--border)]" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted-foreground)]">Subtotal</span>
          <motion.span
            key={total}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-medium"
          >
            {formatCurrency(total)}
          </motion.span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-[var(--foreground)]">Total</span>
          <motion.span
            key={`t-${total}`}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="font-bold text-[var(--wine)]"
          >
            {formatCurrency(total)}
          </motion.span>
        </div>
      </div>

      <Link href="/checkout" className="block">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button className="w-full bg-[var(--wine)] py-6 text-lg text-white hover:bg-[var(--wine-dark)]">
            Continuar para Entrega
          </Button>
        </motion.div>
      </Link>
    </div>
  )
}
