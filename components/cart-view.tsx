'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'

export function CartView() {
  const { items, removeItem, updateQuantity, updateObservations, getTotal } = useCartStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.product.id} className="border-[var(--border)] bg-[var(--card)]">
            <CardContent className="p-4">
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
                        {formatPrice(item.product.price)} cada
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.product.id)}
                      className="text-[var(--muted-foreground)] hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-[var(--border)]"
                      onClick={() =>
                        updateQuantity(item.product.id, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-[var(--border)]"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <span className="ml-auto font-bold text-[var(--wine)]">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-[var(--border)]" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted-foreground)]">Subtotal</span>
          <span className="font-medium">{formatPrice(getTotal())}</span>
        </div>
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-[var(--foreground)]">Total</span>
          <span className="font-bold text-[var(--wine)]">{formatPrice(getTotal())}</span>
        </div>
      </div>

      <Link href="/checkout" className="block">
        <Button className="w-full bg-[var(--wine)] py-6 text-lg text-white hover:bg-[var(--wine-dark)]">
          Continuar para Entrega
        </Button>
      </Link>
    </div>
  )
}
