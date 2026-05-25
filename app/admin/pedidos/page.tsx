import { OrdersList } from '@/components/admin/orders-list'

export default function PedidosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Pedidos
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Gerencie todos os pedidos do seu estabelecimento
        </p>
      </div>

      <OrdersList showAll />
    </div>
  )
}
