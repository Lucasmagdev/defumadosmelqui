'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currency'

export function FloatingCart() {
  const itemCount = useCartStore((s) => s.getItemCount())
  const total = useCartStore((s) => s.getTotal())

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 96, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 96, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden"
        >
          <Link href="/carrinho">
            <motion.div
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 rounded-full bg-[var(--wine)] px-5 py-3 text-white shadow-xl shadow-[var(--wine)]/40"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <motion.span
                  key={itemCount}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-white"
                >
                  {itemCount}
                </motion.span>
              </div>
              <span className="text-sm font-semibold">Ver Carrinho</span>
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-bold"
              >
                {formatCurrency(total)}
              </motion.span>
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
