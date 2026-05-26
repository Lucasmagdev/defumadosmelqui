'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Plus, Minus, Play, X, Star } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MotionButton = motion.create(Button)

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [observations, setObservations] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(0, { stiffness: 220, damping: 22, mass: 0.5 })
  const rotateY = useSpring(0, { stiffness: 220, damping: 22, mass: 0.5 })
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)

  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const cartItem = items.find((i) => i.product.id === product.id)
  const cartQty = cartItem?.quantity ?? 0

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current!.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(x * 14)
    rotateX.set(-y * 9)
    glareX.set((e.clientX - rect.left) / rect.width * 100)
    glareY.set((e.clientY - rect.top) / rect.height * 100)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const handleAddToCart = () => {
    addItem(product, quantity, observations)
    toast.success(`${product.name} adicionado!`)
    setQuantity(1)
    setObservations('')
    setIsDialogOpen(false)
  }

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateQuantity(product.id, cartQty + 1)
  }

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (cartQty <= 1) removeItem(product.id)
    else updateQuantity(product.id, cartQty - 1)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '900px' }}
      className="h-full"
    >
      <motion.article
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] transition-shadow duration-300 hover:shadow-xl hover:shadow-[var(--wine)]/10',
          product.featured && 'ring-1 ring-[var(--gold)]',
          !product.available && 'opacity-75'
        )}
      >
        {/* Glare layer */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
          }}
        />

        {/* Image */}
        <div className="relative aspect-[5/4] flex-shrink-0 overflow-hidden">
          {/* Clip-path reveal on scroll into view */}
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="absolute inset-0"
          >
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </motion.div>

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />

          {/* Featured badge */}
          {product.featured && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              <Star className="h-3 w-3 fill-current" />
              Destaque
            </div>
          )}

          {/* Cart qty badge */}
          <AnimatePresence>
            {cartQty > 0 && (
              <motion.div
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--wine)] shadow-lg"
              >
                <motion.span
                  key={cartQty}
                  initial={{ scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                  className="text-xs font-bold text-white"
                >
                  {cartQty}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unavailable overlay */}
          {!product.available && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <Badge variant="secondary" className="bg-white/90 text-[var(--foreground)]">
                Indisponível
              </Badge>
            </div>
          )}

          {/* Video button */}
          {product.videoUrl && product.available && (
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowVideo(true)}
              aria-label={`Assistir vídeo de ${product.name}`}
              className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--wine)] text-white shadow-lg"
            >
              <Play className="h-4 w-4 fill-current" />
            </motion.button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-[17px] font-semibold leading-snug text-[var(--foreground)]">
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {product.description}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xl font-bold text-[var(--wine)]">
              {formatCurrency(product.price)}
            </span>

            <AnimatePresence mode="wait" initial={false}>
              {cartQty > 0 ? (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.button whileTap={{ scale: 0.78 }} onClick={handleDecrease}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--wine)] hover:text-[var(--wine)]"
                  >
                    <Minus className="h-3 w-3" />
                  </motion.button>
                  <motion.span
                    key={cartQty}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="w-7 text-center text-sm font-bold"
                  >
                    {cartQty}
                  </motion.span>
                  <motion.button whileTap={{ scale: 0.78 }} onClick={handleIncrease}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                  >
                    <Plus className="h-3 w-3" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                >
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <MotionButton
                        size="sm"
                        disabled={!product.available}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="h-9 rounded-full bg-[var(--wine)] px-5 text-sm text-white hover:bg-[var(--wine-dark)]"
                      >
                        Adicionar
                      </MotionButton>
                    </DialogTrigger>

                    <DialogContent className="max-w-md bg-[var(--background)]">
                      <DialogHeader>
                        <DialogTitle className="text-[var(--foreground)]">{product.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative aspect-video overflow-hidden rounded-xl">
                          <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{product.description}</p>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-[var(--foreground)]">Observações (opcional)</label>
                          <Textarea
                            placeholder="Ex: sem cebola, sem milho, ponto da carne..."
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            className="border-[var(--border)] bg-[var(--background)]"
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="border-[var(--border)]">
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center text-lg font-bold">{quantity}</span>
                            <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)} className="border-[var(--border)]">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-lg font-bold text-[var(--wine)]">{formatCurrency(product.price * quantity)}</span>
                        </div>
                        <Button onClick={handleAddToCart} className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]">
                          Adicionar ao Carrinho
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.article>

      {/* Video modal */}
      {showVideo && product.videoUrl && (
        <Dialog open={showVideo} onOpenChange={setShowVideo}>
          <DialogContent className="max-w-3xl bg-black p-0">
            <button onClick={() => setShowVideo(false)} aria-label="Fechar vídeo"
              className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30">
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video">
              <iframe src={product.videoUrl} className="h-full w-full" allowFullScreen />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
