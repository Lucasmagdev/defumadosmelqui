'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Product, Category } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    category: row.category as string,
    imageUrl: row.image_url as string,
    videoUrl: row.video_url as string | undefined,
    available: row.available as boolean,
  }
}

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: rawProducts } = useSWR<Record<string, unknown>[]>('/api/products', fetcher)
  const { data: categories } = useSWR<Category[]>('/api/categories', fetcher)

  const products = rawProducts?.map(mapProduct) || []

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'transition-all',
            selectedCategory === null
              ? 'bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]'
              : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--wine)] hover:text-[var(--wine)]'
          )}
        >
          Todos
        </Button>
        {(categories || []).map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.slug ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.slug)}
            className={cn(
              'transition-all',
              selectedCategory === category.slug
                ? 'bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]'
                : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--wine)] hover:text-[var(--wine)]'
            )}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-[var(--muted-foreground)]">
            Nenhum produto encontrado nesta categoria.
          </p>
        </div>
      )}
    </div>
  )
}
