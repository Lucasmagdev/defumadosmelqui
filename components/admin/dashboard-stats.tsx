'use client'

import useSWR from 'swr'
import { DollarSign, ShoppingCart, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DashboardStats() {
  const { data } = useSWR('/api/admin/dashboard', fetcher, { refreshInterval: 30000 })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

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
      description: 'Valor total em vendas',
    },
    {
      title: 'Ticket Médio',
      value: data ? formatPrice(data.averageTicket) : '-',
      icon: TrendingUp,
      description: 'Média por pedido',
    },
    {
      title: 'Mais Vendido',
      value: data?.bestSelling?.name || '-',
      icon: Award,
      description: data?.bestSelling ? `${data.bestSelling.count} unidades` : 'Sem vendas hoje',
    },
  ]

  return (
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
  )
}
