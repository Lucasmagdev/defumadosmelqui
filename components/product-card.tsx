'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Plus, Minus, Play, X } from 'lucide-react'
import { Product } from '@/lib/types'
import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [observations, setObservations] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAddToCart = () => {
    addItem(product, quantity, observations)
    toast.success(`${product.name} adicionado ao carrinho!`)
    setQuantity(1)
    setObservations('')
    setIsDialogOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  return (
    <Card className="group overflow-hidden border-[var(--border)] bg-[var(--card)] transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {!product.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Badge variant="secondary" className="bg-[var(--secondary)] text-[var(--foreground)]">
              Indisponível
            </Badge>
          </div>
        )}
        {product.videoUrl && product.available && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--wine)] text-white shadow-lg transition-transform hover:scale-110"
          >
            <Play className="h-5 w-5 fill-current" />
          </button>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
          {product.description}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xl font-bold text-[var(--wine)]">
            {formatPrice(product.price)}
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                disabled={!product.available}
                className="bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
              >
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-[var(--background)]">
              <DialogHeader>
                <DialogTitle className="text-[var(--foreground)]">{product.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">{product.description}</p>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Observações (opcional)
                  </label>
                  <Textarea
                    placeholder="Ex: sem cebola, sem milho, ponto da carne..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="border-[var(--border)] bg-[var(--background)]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="border-[var(--border)]"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-lg font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="border-[var(--border)]"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-lg font-bold text-[var(--wine)]">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                >
                  Adicionar ao Carrinho
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>

      {showVideo && product.videoUrl && (
        <Dialog open={showVideo} onOpenChange={setShowVideo}>
          <DialogContent className="max-w-3xl bg-black p-0">
            <button
              onClick={() => setShowVideo(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="aspect-video">
              <iframe
                src={product.videoUrl}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}
