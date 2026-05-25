'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { orderStatusLabels, orderStatusColors } from '@/lib/mock-data'
import { OrderStatus } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const statusFlow: OrderStatus[] = ['received', 'preparing', 'smoking', 'finished', 'out_for_delivery', 'delivered']

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface DbOrder {
  id: string
  status: OrderStatus
  total: number
  delivery_method: string
  created_at: string
  customer: { name: string; phone: string }
  items: { product_id: string; product_name: string; product_price: number; quantity: number; observations: string }[]
}

export function OrdersList({ showAll = false }: { showAll?: boolean }) {
  const { data: orders = [] } = useSWR<DbOrder[]>('/api/admin/orders', fetcher, { refreshInterval: 15000 })

  const displayOrders = showAll ? orders : orders.slice(0, 5)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    mutate('/api/admin/orders')
    mutate('/api/admin/dashboard')
  }

  if (orders.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-[var(--muted-foreground)]">Nenhum pedido encontrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
      <CardHeader>
        <CardTitle className="text-[var(--foreground)]">
          {showAll ? 'Todos os Pedidos' : 'Pedidos Recentes'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={showAll ? 'h-[600px]' : 'h-[400px]'}>
          <div className="space-y-4">
            {displayOrders.map((order) => {
              const nextStatus = statusFlow[statusFlow.indexOf(order.status) + 1]
              return (
                <div key={order.id} className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge className={cn('text-xs', orderStatusColors[order.status])}>
                          {orderStatusLabels[order.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {order.customer.name} • {order.customer.phone}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {format(new Date(order.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[var(--wine)]">
                        {formatPrice(Number(order.total))}
                      </span>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {order.delivery_method === 'delivery' ? 'Delivery' : 'Retirada'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-[var(--foreground)]">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="text-[var(--muted-foreground)]">
                          {formatPrice(Number(item.product_price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
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
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
