'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Package, ChevronDown, ChevronUp, Flame } from 'lucide-react'
import useSWR from 'swr'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { orderStatusLabels, orderStatusColors } from '@/lib/mock-data'
import { Header } from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const formatPrice = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const STATUS_STEPS = [
  'received',
  'preparing',
  'smoking',
  'finished',
  'out_for_delivery',
  'delivered',
]

interface OrderItem {
  product_name: string
  product_price: number
  quantity: number
  observations?: string
}

interface Order {
  id: string
  status: string
  total: number
  subtotal: number
  delivery_fee: number
  delivery_method: string
  payment_method: string
  scheduled_date?: string
  scheduled_time?: string
  created_at: string
  items: OrderItem[]
}

const paymentLabels: Record<string, string> = {
  square: 'Cartão (Square)',
  pix: 'PIX',
  cash: 'Dinheiro',
}

function StatusProgress({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1">
      {STATUS_STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-1">
          <div
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              i <= currentIdx ? 'bg-[var(--wine)]' : 'bg-[var(--border)]'
            )}
          />
        </div>
      ))}
    </div>
  )
}

export default function MeusPedidosPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [authChecked, setAuthChecked] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setAuthChecked(true)
    })
  }, [router, supabase.auth])

  const { data: orders = [], isLoading } = useSWR<Order[]>(
    authChecked ? '/api/meus-pedidos' : null,
    fetcher,
    { refreshInterval: 15000 }
  )

  if (!authChecked) return null

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1
            className="font-serif text-3xl font-bold text-[var(--foreground)]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Meus Pedidos
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Atualiza automaticamente a cada 15 segundos
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-[var(--secondary)]" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]">
              <Package className="h-10 w-10 text-[var(--muted-foreground)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Nenhum pedido ainda</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Seus pedidos aparecerão aqui após a compra
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expanded === order.id
              const isActive = !['delivered', 'finished'].includes(order.status)

              return (
                <Card
                  key={order.id}
                  className={cn(
                    'border-[var(--border)] bg-[var(--card)] transition-shadow',
                    isActive && 'border-[var(--wine)]/40 shadow-sm'
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div
                      className="flex cursor-pointer items-start justify-between gap-2"
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)]">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge className={cn('text-xs', orderStatusColors[order.status])}>
                            {orderStatusLabels[order.status]}
                          </Badge>
                          {isActive && (
                            <span className="flex items-center gap-1 text-xs text-[var(--wine)]">
                              <Flame className="h-3 w-3" />
                              Em andamento
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {order.delivery_method === 'delivery' ? 'Delivery' : 'Retirada na loja'} •{' '}
                          {paymentLabels[order.payment_method] || order.payment_method}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-[var(--wine)]">
                          {formatPrice(Number(order.total))}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                        )}
                      </div>
                    </div>

                    {/* Status progress bar */}
                    <div className="mt-4">
                      <StatusProgress status={order.status} />
                      <div className="mt-1 flex justify-between text-xs text-[var(--muted-foreground)]">
                        <span>Recebido</span>
                        <span>Entregue</span>
                      </div>
                    </div>

                    {/* Expanded */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4">
                        <Separator className="bg-[var(--border)]" />

                        {/* Items */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-[var(--foreground)]">Itens</p>
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg bg-[var(--secondary)] p-3"
                            >
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-[var(--foreground)]">
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span className="text-[var(--wine)]">
                                  {formatPrice(Number(item.product_price) * item.quantity)}
                                </span>
                              </div>
                              {item.observations && (
                                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                                  Obs: {item.observations}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between text-[var(--muted-foreground)]">
                            <span>Subtotal</span>
                            <span>{formatPrice(Number(order.subtotal))}</span>
                          </div>
                          <div className="flex justify-between text-[var(--muted-foreground)]">
                            <span>Taxa de entrega</span>
                            <span>
                              {Number(order.delivery_fee) > 0
                                ? formatPrice(Number(order.delivery_fee))
                                : 'Grátis'}
                            </span>
                          </div>
                          <Separator className="my-1 bg-[var(--border)]" />
                          <div className="flex justify-between font-bold text-[var(--foreground)]">
                            <span>Total</span>
                            <span className="text-[var(--wine)]">{formatPrice(Number(order.total))}</span>
                          </div>
                        </div>

                        {order.scheduled_date && (
                          <p className="text-sm text-[var(--wine)]">
                            ⏰ Agendado: {order.scheduled_date} às {order.scheduled_time}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
