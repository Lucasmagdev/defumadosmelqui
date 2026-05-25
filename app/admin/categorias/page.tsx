import { CategoriesManagement } from '@/components/admin/categories-management'

export default function CategoriasPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1
          className="font-serif text-3xl font-bold text-[var(--foreground)]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Categorias
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Gerencie as categorias do cardápio
        </p>
      </div>
      <CategoriesManagement />
    </div>
  )
}
