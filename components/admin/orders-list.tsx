'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Search, Clock, MapPin, CreditCard, CircleCheckBig, ClipboardList, Flame, Inbox } from 'lucide-react'
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
import { formatCurrency } from '@/lib/currency'

const statusFlow: OrderStatus[] = ['received', 'preparing', 'smoking', 'finished', 'out_for_delivery', 'delivered']
const activeStatuses: OrderStatus[] = ['received', 'preparing', 'smoking', 'out_for_delivery']
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

export function OrdersList({ showAll = false }: { showAll?: boolean }) {
  const { data: orders = [], error, isLoading } = useSWR<DbOrder[]>('/api/admin/orders', fetcher, { refreshInterval: 15000 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DbOrder | null>(null)

  const filtered = orders.filter((o) => {
    const matchStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? activeStatuses.includes(o.status) :
      o.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const displayOrders = showAll ? filtered : filtered.slice(0, 5)
  const countByStatus = (status: OrderStatus) => orders.filter((order) => order.status === status).length
  const activeCount = orders.filter((order) => activeStatuses.includes(order.status)).length
  const overview = [
    {
      label: 'Em andamento',
      value: activeCount,
      detail: 'pedidos ativos',
      filter: 'active',
      icon: ClipboardList,
    },
    {
      label: 'Recebidos',
      value: countByStatus('received'),
      detail: 'aguardando início',
      filter: 'received',
      icon: Inbox,
    },
    {
      label: 'Defumando',
      value: countByStatus('smoking'),
      detail: 'em produção',
      filter: 'smoking',
      icon: Flame,
    },
    {
      label: 'Entregues',
      value: countByStatus('delivered'),
      detail: 'concluídos',
      filter: 'delivered',
      icon: CircleCheckBig,
    },
  ]

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
      {showAll && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overview.map((stat) => {
            const active = statusFilter === stat.filter
            return (
              <button
                key={stat.label}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(active ? 'all' : stat.filter)}
                className={cn(
                  'flex items-center justify-between rounded-xl border bg-[var(--card)] p-4 text-left shadow-sm transition hover:border-[var(--wine)]/35 hover:shadow-md',
                  active && 'border-[var(--wine)] bg-[var(--wine)]/[0.04] ring-1 ring-[var(--wine)]/10',
                )}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{stat.value}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{stat.detail}</p>
                </div>
                <div className={cn('rounded-xl bg-[var(--wine)]/[0.08] p-3 text-[var(--wine)]', active && 'bg-[var(--wine)] text-white')}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Card className="gap-0 overflow-hidden border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="space-y-5 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <CardTitle className="text-lg text-[var(--foreground)]">
                {showAll ? 'Fila de pedidos' : 'Pedidos Recentes'}
              </CardTitle>
              {showAll && (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {filtered.length} de {orders.length} pedido{orders.length === 1 ? '' : 's'} exibido{filtered.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
            {showAll && statusFilter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')} className="text-[var(--wine)] hover:bg-[var(--wine)]/5 hover:text-[var(--wine)]">
                Limpar filtro
              </Button>
            )}
          </div>

          {showAll && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Buscar por nome, telefone ou ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 border-[var(--border)] bg-white pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full border-[var(--border)] bg-white sm:w-[210px] lg:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_TABS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="hidden flex-wrap gap-2 lg:flex">
                {STATUS_TABS.map((tab) => {
                  const active = statusFilter === tab.value
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(tab.value)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition-colors',
                        active
                          ? 'border-[var(--wine)] bg-[var(--wine)] text-white'
                          : 'border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--wine)]/30 hover:text-[var(--foreground)]',
                      )}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-[var(--muted-foreground)]">
              Carregando pedidos...
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 text-sm text-red-600">
              Não foi possível carregar os pedidos.
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="mb-3 h-9 w-9 text-[var(--wine)]/35" />
              <p className="font-medium text-[var(--foreground)]">Nenhum pedido encontrado</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Altere o filtro ou a busca para ver outros pedidos.</p>
            </div>
          ) : (
            <div className={cn('space-y-3 overflow-y-auto', showAll ? 'max-h-[calc(100vh-31rem)] min-h-[180px]' : 'max-h-[400px]')}>
              {displayOrders.map((order) => {
                const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1]
                return (
                  <div
                    key={order.id}
                    className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-4 transition-all hover:border-[var(--wine)]/35 hover:shadow-sm sm:p-5"
                    onClick={() => setSelected(order)}
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(250px,1fr)_minmax(260px,1.05fr)_235px] lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
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
                        <p className="mt-4 font-medium text-[var(--foreground)]">
                          {order.customer.name}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">{order.customer.phone}</p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <Clock className="h-3.5 w-3.5" />
                          {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {order.scheduled_date && (
                          <p className="mt-2 rounded-md bg-[var(--wine)]/[0.06] px-2 py-1 text-xs font-medium text-[var(--wine)]">
                            Agendado: {order.scheduled_date} {order.scheduled_time}
                          </p>
                        )}
                      </div>

                      <div className="border-t border-[var(--border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                          {order.items.reduce((total, item) => total + item.quantity, 0)} item(ns)
                        </p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between gap-3 text-sm">
                              <span className="text-[var(--foreground)]">{item.quantity}x {item.product_name}</span>
                              <span className="shrink-0 text-[var(--muted-foreground)]">
                                {formatCurrency(Number(item.product_price) * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div
                        className="border-t border-[var(--border)] pt-4 lg:border-t-0 lg:pt-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="mb-4 text-xl font-bold text-[var(--wine)] lg:text-right">
                          {formatCurrency(Number(order.total))}
                        </p>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={order.status}
                            onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}
                          >
                            <SelectTrigger className="h-9 w-full border-[var(--border)] bg-white text-sm">
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
                              className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                            >
                              Avançar para {orderStatusLabels[nextStatus]}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(order)}
                            className="w-full text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                          >
                            Ver detalhes
                          </Button>
                        </div>
                      </div>
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
                    {selected.customer.neighborhood ? `${selected.customer.neighborhood}, ` : ''}{selected.customer.city} - {selected.customer.state}
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
                        <span className="text-[var(--wine)]">{formatCurrency(Number(item.product_price) * item.quantity)}</span>
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
                  <span>{formatCurrency(Number(selected.subtotal))}</span>
                </div>
                <div className="flex justify-between text-[var(--muted-foreground)]">
                  <span>Taxa de entrega</span>
                  <span>{Number(selected.delivery_fee) > 0 ? formatCurrency(Number(selected.delivery_fee)) : 'Grátis'}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[var(--foreground)]">
                  <span>Total</span>
                  <span className="text-[var(--wine)]">{formatCurrency(Number(selected.total))}</span>
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
