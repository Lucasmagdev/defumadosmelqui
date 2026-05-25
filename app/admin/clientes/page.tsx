import { CustomersManagement } from '@/components/admin/customers-management'

export default function ClientesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Clientes
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Histórico e informações dos clientes
        </p>
      </div>

      <CustomersManagement />
    </div>
  )
}
