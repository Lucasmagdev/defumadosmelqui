import { ProductsManagement } from '@/components/admin/products-management'

export default function ProdutosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Produtos
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Gerencie o catálogo de produtos
        </p>
      </div>

      <ProductsManagement />
    </div>
  )
}
