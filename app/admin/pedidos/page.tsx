import { OrdersList } from '@/components/admin/orders-list'

export default function PedidosPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--wine)]">
          Operação
        </p>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Pedidos
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted-foreground)] sm:text-base">
          Acompanhe a fila, avance cada etapa de preparo e consulte os detalhes de entrega.
        </p>
      </div>

      <OrdersList showAll />
    </div>
  )
}
