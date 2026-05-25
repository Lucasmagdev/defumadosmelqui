'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Search, Clock, MapPin, CreditCard } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { orderStatusLabels, orderStatusColors } from '@/lib/mock-data'
import { OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const statusFlow: OrderStatus[] = ['received', 'preparing', 'smoking', 'finished', 'out_for_delivery', 'delivered']
const fetcher = (url: string) => fetch(url).then((r) => r.json())

const paymentLabels: Record<string, string> = {
  square: 'Cartão (Square)',
  pix: 'PIX',
  cash: 'Dinheiro',
}

interface DbOrder {
  id: string
  status: OrderStatus
  total: number
  subtotal: number
  delivery_fee: number
  delivery_method: string
  payment_method: string
  scheduled_date?: string
  scheduled_time?: string
  created_at: string
  customer: { name: string; phone: string; email?: string; street: string; number: string; complement?: string; neighborhood: string; city: string; state: string }
  items: { product_id: string; product_name: string; product_price: number; quantity: number; observations?: string }[]
}

const STATUS_TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Em Andamento' },
  { value: 'received', label: 'Recebidos' },
  { value: 'preparing', label: 'Em Preparo' },
  { value: 'smoking', label: 'Defumando' },
  { value: 'finished', label: 'Finalizados' },
  { value: 'out_for_delivery', label: 'Em Entrega' },
  { value: 'delivered', label: 'Entregues' },
]

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

export function OrdersList({ showAll = false }: { showAll?: boolean }) {
  const { data: orders = [] } = useSWR<DbOrder[]>('/api/admin/orders', fetcher, { refreshInterval: 15000 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DbOrder | null>(null)

  const filtered = orders.filter((o) => {
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? !['delivered', 'finished'].includes(o.status) :
      o.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const displayOrders = showAll ? filtered : filtered.slice(0, 5)

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    mutate('/api/admin/orders')
    mutate('/api/admin/dashboard')
    mutate('/api/admin/dashboard/weekly')
    if (selected?.id === orderId) setSelected({ ...selected, status })
  }

  return (
    <>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="space-y-4">
          <CardTitle className="text-[var(--foreground)]">
            {showAll ? 'Todos os Pedidos' : 'Pedidos Recentes'}
          </CardTitle>

          {showAll && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Buscar por nome, telefone ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-[var(--border)] pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full border-[var(--border)] sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_TABS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-[var(--muted-foreground)]">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className={cn('space-y-4 overflow-y-auto', showAll ? 'max-h-[600px]' : 'max-h-[400px]')}>
              {displayOrders.map((order) => {
                const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1]
                return (
                  <div
                    key={order.id}
                    className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--wine)]/50"
                    onClick={() => setSelected(order)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--foreground)]">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge className={cn('text-xs', orderStatusColors[order.status])}>
                            {orderStatusLabels[order.status]}
                          </Badge>
                          {order.delivery_method === 'delivery' ? (
                            <Badge variant="outline" className="text-xs border-[var(--border)]">Delivery</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-[var(--border)]">Retirada</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {order.customer.name} • {order.customer.phone}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          {order.scheduled_date && (
                            <span className="ml-2 text-[var(--wine)]">
                              ⏰ Agendado {order.scheduled_date} {order.scheduled_time}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-[var(--wine)]">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-[var(--foreground)]">{item.quantity}x {item.product_name}</span>
                          <span className="text-[var(--muted-foreground)]">
                            {formatPrice(Number(item.product_price) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="mt-4 flex flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}
                      >
                        <SelectTrigger className="h-8 w-[180px] border-[var(--border)] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusFlow.map((status) => (
                            <SelectItem key={status} value={status}>
                              {orderStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, nextStatus)}
                          className="bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                        >
                          {orderStatusLabels[nextStatus]}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg bg-[var(--background)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
                Pedido #{selected.id.slice(0, 8).toUpperCase()}
                <Badge className={cn('text-xs', orderStatusColors[selected.status])}>
                  {orderStatusLabels[selected.status]}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              {/* Customer */}
              <div className="rounded-lg bg-[var(--secondary)] p-3 space-y-1">
                <p className="font-semibold text-[var(--foreground)]">{selected.customer.name}</p>
                <p className="text-[var(--muted-foreground)]">{selected.customer.phone}</p>
                {selected.customer.email && (
                  <p className="text-[var(--muted-foreground)]">{selected.customer.email}</p>
                )}
              </div>

              {/* Delivery info */}
              <div className="rounded-lg bg-[var(--secondary)] p-3 space-y-1">
                <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                  <MapPin className="h-4 w-4 text-[var(--wine)]" />
                  {selected.delivery_method === 'delivery' ? 'Delivery' : 'Retirada na loja'}
                </div>
                {selected.delivery_method === 'delivery' && (
                  <p className="text-[var(--muted-foreground)]">
                    {selected.customer.street}, {selected.customer.number}
                    {selected.customer.complement && ` - ${selected.customer.complement}`},{' '}
                    {selected.customer.neighborhood}, {selected.customer.city} - {selected.customer.state}
                  </p>
                )}
                {selected.scheduled_date && (
                  <div className="flex items-center gap-2 text-[var(--wine)]">
                    <Clock className="h-4 w-4" />
                    Agendado: {selected.scheduled_date} às {selected.scheduled_time}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="flex items-center gap-2 rounded-lg bg-[var(--secondary)] p-3">
                <CreditCard className="h-4 w-4 text-[var(--wine)]" />
                <span className="text-[var(--foreground)]">{paymentLabels[selected.payment_method] || selected.payment_method}</span>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2 font-semibold text-[var(--foreground)]">Itens</p>
                <div className="space-y-2">
                  {selected.items.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-[var(--border)] p-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-[var(--foreground)]">{item.quantity}x {item.product_name}</span>
                        <span className="text-[var(--wine)]">{formatPrice(Number(item.product_price) * item.quantity)}</span>
                      </div>
                      {item.observations && (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">Obs: {item.observations}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-[var(--border)]" />

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Subtotal</span>
                  <span>{formatPrice(Number(selected.subtotal))}</span>
                </div>
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Taxa de entrega</span>
                  <span>{Number(selected.delivery_fee) > 0 ? formatPrice(Number(selected.delivery_fee)) : 'Grátis'}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[var(--foreground)]">
                  <span>Total</span>
                  <span className="text-[var(--wine)]">{formatPrice(Number(selected.total))}</span>
                </div>
              </div>

              <Separator className="bg-[var(--border)]" />

              {/* Status update inside dialog */}
              <div className="flex flex-wrap gap-2">
                {statusFlow.map((status) => {
                  const nextIdx = statusFlow.indexOf(selected.status) + 1
                  const isNext = statusFlow[nextIdx] === status
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={isNext ? 'default' : 'outline'}
                      className={cn(
                        isNext
                          ? 'bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]'
                          : 'border-[var(--border)] text-[var(--foreground)]',
                        selected.status === status && 'opacity-50 cursor-default'
                      )}
                      disabled={selected.status === status}
                      onClick={() => updateStatus(selected.id, status)}
                    >
                      {orderStatusLabels[status]}
                    </Button>
                  )
                })}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
