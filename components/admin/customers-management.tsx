'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

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
}

export function CustomersManagement() {
  const { data: customers = [] } = useSWR<EnrichedCustomer[]>('/api/admin/customers', fetcher)

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

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
      <CardHeader>
        <CardTitle className="text-[var(--foreground)]">Clientes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
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
                  <div className="text-right">
                    <p className="text-sm text-[var(--muted-foreground)]">Total gasto</p>
                    <p className="text-lg font-bold text-[var(--wine)]">
                      {formatPrice(customer.totalSpent)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-[var(--secondary)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">Pedidos</p>
                    <p className="text-xl font-bold text-[var(--foreground)]">{customer.orderCount}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--secondary)] p-3">
                    <p className="text-xs text-[var(--muted-foreground)]">Ticket Médio</p>
                    <p className="text-xl font-bold text-[var(--foreground)]">
                      {formatPrice(customer.averageTicket)}
                    </p>
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

                <div className="mt-3 rounded-lg bg-[var(--muted)] p-3">
                  <p className="text-xs font-medium text-[var(--muted-foreground)]">Endereço</p>
                  <p className="text-sm text-[var(--foreground)]">
                    {customer.street}, {customer.number}
                    {customer.complement && ` - ${customer.complement}`}
                  </p>
                  <p className="text-sm text-[var(--foreground)]">
                    {customer.neighborhood}, {customer.city} - {customer.state}
                  </p>
                  <p className="text-sm text-[var(--foreground)]">CEP: {customer.zip_code}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
