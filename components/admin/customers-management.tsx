'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import useSWR from 'swr'
import { orderStatusColors, orderStatusLabels } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { formatCurrency, STORE_COUNTRY } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface EnrichedCustomer {
  id: string
  name: string
  phone: string
  email?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  created_at: string
  orderCount: number
  totalSpent: number
  averageTicket: number
  favorites: { name: string; count: number }[]
  orderHistory: { id: string; total: number; status: string; createdAt: string }[]
}

export function CustomersManagement() {
  const { data: customers = [] } = useSWR<EnrichedCustomer[]>('/api/admin/customers', fetcher)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  if (customers.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-[var(--muted-foreground)]">Nenhum cliente cadastrado</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--card)]">
      <CardHeader className="space-y-4">
        <CardTitle className="text-[var(--foreground)]">
          Clientes <span className="text-sm font-normal text-[var(--muted-foreground)]">({filtered.length})</span>
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-[var(--border)] pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] space-y-4 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-[var(--muted-foreground)]">Nenhum cliente encontrado</p>
          ) : (
            filtered.map((customer) => {
              const isExpanded = expanded === customer.id
              return (
                <div
                  key={customer.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)]"
                >
                  {/* Header row — always visible */}
                  <div
                    className="flex cursor-pointer flex-wrap items-start justify-between gap-4 p-4"
                    onClick={() => setExpanded(isExpanded ? null : customer.id)}
                  >
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)]">{customer.name}</h3>
                      <p className="text-sm text-[var(--muted-foreground)]">{customer.phone}</p>
                      {customer.email && (
                        <p className="text-sm text-[var(--muted-foreground)]">{customer.email}</p>
                      )}
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Cliente desde {format(new Date(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <p className="text-xs text-[var(--muted-foreground)]">Total gasto</p>
                        <p className="text-lg font-bold text-[var(--wine)]">{formatCurrency(customer.totalSpent)}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{customer.orderCount} pedidos</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)]">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] p-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                          <p className="text-xs text-[var(--muted-foreground)]">Pedidos</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{customer.orderCount}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                          <p className="text-xs text-[var(--muted-foreground)]">Ticket Médio</p>
                          <p className="text-xl font-bold text-[var(--foreground)]">{formatCurrency(customer.averageTicket)}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--secondary)] p-3">
                          <p className="text-xs text-[var(--muted-foreground)]">Favoritos</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {customer.favorites.length > 0 ? (
                              customer.favorites.map((fav, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="border-[var(--gold)] text-xs text-[var(--foreground)]"
                                >
                                  {fav.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-[var(--muted-foreground)]">-</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-[var(--secondary)] p-3">
                        <p className="text-xs font-medium text-[var(--muted-foreground)]">Endereço</p>
                        <p className="mt-1 text-sm text-[var(--foreground)]">
                          {customer.street}, {customer.number}
                          {customer.complement && ` - ${customer.complement}`}
                        </p>
                        <p className="text-sm text-[var(--foreground)]">
                          {customer.neighborhood ? `${customer.neighborhood}, ` : ''}{customer.city} - {customer.state}
                        </p>
                        <p className="text-sm text-[var(--foreground)]">{STORE_COUNTRY === 'US' ? 'ZIP Code' : 'CEP'}: {customer.zip_code}</p>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">Histórico de pedidos</p>
                        {customer.orderHistory.length === 0 ? (
                          <p className="text-sm text-[var(--muted-foreground)]">Nenhum pedido realizado.</p>
                        ) : (
                          <div className="space-y-2">
                            {customer.orderHistory.map((order) => (
                              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-white p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[var(--foreground)]">#{order.id.slice(0, 8).toUpperCase()}</span>
                                  <Badge className={cn('text-xs', orderStatusColors[order.status])}>
                                    {orderStatusLabels[order.status]}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-[var(--muted-foreground)]">
                                    {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                  <span className="font-semibold text-[var(--wine)]">{formatCurrency(order.total)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
