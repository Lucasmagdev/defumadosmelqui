'use client'

import useSWR from 'swr'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { orderStatusLabels } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/currency'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface WeekDay {
  day: string
  date: string
  revenue: number
  orders: number
}

const STATUS_COLORS: Record<string, string> = {
  received: '#3b82f6',
  preparing: '#eab308',
  smoking: '#f97316',
  finished: '#22c55e',
  out_for_delivery: '#a855f7',
  delivered: '#6b7280',
}

export function RevenueChart() {
  const { data } = useSWR<{ weekly: WeekDay[]; statusCounts: Record<string, number> }>(
    '/api/admin/dashboard/weekly',
    fetcher,
    { refreshInterval: 60000 }
  )

  const weekly = data?.weekly || []
  const statusCounts = data?.statusCounts || {}

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    label: orderStatusLabels[status] || status,
    count,
    color: STATUS_COLORS[status] || '#6b7280',
  }))

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Revenue area chart */}
      <Card className="border-[var(--border)] bg-[var(--card)] lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--foreground)]">
            Receita — Últimos 7 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekly} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--wine)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--wine)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCurrency(v, { maximumFractionDigits: 0 })}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v, { maximumFractionDigits: 0 }), 'Receita']}
                labelFormatter={(l) => `Data: ${l}`}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--wine)"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders by status bar chart */}
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--foreground)]">
            Pedidos por Status (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">Sem pedidos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                  width={25}
                />
                <Tooltip
                  formatter={(v: number) => [v, 'Pedidos']}
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
