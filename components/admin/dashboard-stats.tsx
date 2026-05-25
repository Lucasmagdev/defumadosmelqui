'use client'

import useSWR from 'swr'
import { DollarSign, ShoppingCart, TrendingUp, Award, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { orderStatusLabels, orderStatusColors } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

const ACTIVE_STATUSES = ['received', 'preparing', 'smoking', 'out_for_delivery']

export function DashboardStats() {
  const { data } = useSWR('/api/admin/dashboard', fetcher, { refreshInterval: 15000 })
  const { data: weekly } = useSWR('/api/admin/dashboard/weekly', fetcher, { refreshInterval: 30000 })

  const statusCounts: Record<string, number> = weekly?.statusCounts || {}
  const activeCount = ACTIVE_STATUSES.reduce((s, st) => s + (statusCounts[st] || 0), 0)

  const stats = [
    {
      title: 'Pedidos Hoje',
      value: data?.ordersCount ?? '-',
      icon: ShoppingCart,
      description: 'Total de pedidos recebidos',
    },
    {
      title: 'Receita do Dia',
      value: data ? formatPrice(data.revenue) : '-',
      icon: DollarSign,
      description: 'Valor total em vendas hoje',
    },
    {
      title: 'Ticket Médio',
      value: data ? formatPrice(data.averageTicket) : '-',
      icon: TrendingUp,
      description: 'Média por pedido hoje',
    },
    {
      title: 'Mais Vendido',
      value: data?.bestSelling?.name || '-',
      icon: Award,
      description: data?.bestSelling ? `${data.bestSelling.count} unidades hoje` : 'Sem vendas hoje',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-[var(--wine)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--foreground)]">{stat.value}</div>
              <p className="text-xs text-[var(--muted-foreground)]">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active orders breakdown */}
      {activeCount > 0 && (
        <Card className="border-[var(--wine)]/30 bg-[var(--wine)]/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <Clock className="h-4 w-4 text-[var(--wine)]" />
              {activeCount} pedido{activeCount > 1 ? 's' : ''} em andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ACTIVE_STATUSES.map((status) => {
                const count = statusCounts[status] || 0
                if (count === 0) return null
                return (
                  <Badge
                    key={status}
                    className={cn('text-sm', orderStatusColors[status])}
                  >
                    {orderStatusLabels[status]}: {count}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
