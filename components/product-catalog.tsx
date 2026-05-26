'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Product, Category } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'name_asc'

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
    featured: row.featured as boolean,
    displayOrder: row.display_order as number,
  }
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
      <Skeleton className="aspect-[5/4] w-full" />
      <div className="space-y-2 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  )
}

export function ProductCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('default')

  const { data: rawProducts, error: productsError, isLoading: loadingProducts } = useSWR<Record<string, unknown>[]>('/api/products', fetcher)
  const { data: categories, isLoading: loadingCategories } = useSWR<Category[]>('/api/categories', fetcher)

  const products = useMemo(() => rawProducts?.map(mapProduct) || [], [rawProducts])

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchCat = !selectedCategory || p.category === selectedCategory
      const q = search.toLowerCase()
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })

    switch (sort) {
      case 'price_asc':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'name_asc':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        break
      default:
        // Featured first, then by display_order
        list = [...list].sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
        })
    }
    return list
  }, [products, selectedCategory, search, sort])

  const countByCategory = (slug: string) => products.filter((p) => p.category === slug).length
  const isLoading = loadingProducts || loadingCategories

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
            <SlidersHorizontal className="h-4 w-4 text-[var(--wine)]" />
            Encontre seu pedido
          </div>
          {!isLoading && (
            <p className="text-sm text-[var(--muted-foreground)]">
              {filtered.length} produto{filtered.length === 1 ? '' : 's'} encontrado{filtered.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Busque por costela, brisket, acompanhamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-[var(--border)] bg-white pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="h-11 w-full border-[var(--border)] bg-white sm:w-52">
              <ArrowUpDown className="mr-2 h-4 w-4 text-[var(--muted-foreground)]" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Destaques primeiro</SelectItem>
              <SelectItem value="price_asc">Menor preço</SelectItem>
              <SelectItem value="price_desc">Maior preço</SelectItem>
              <SelectItem value="name_asc">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {loadingCategories ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />
            ))
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  selectedCategory === null
                    ? 'bg-[var(--wine)] text-white'
                    : 'border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--wine)] hover:text-[var(--wine)]'
                )}
              >
                Todos
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-xs">{products.length}</span>
              </motion.button>
              {(categories || []).map((category) => {
                const count = countByCategory(category.slug)
                const active = selectedCategory === category.slug
                return (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedCategory(active ? null : category.slug)}
                    className={cn(
                      'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-[var(--wine)] text-white'
                        : 'border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--wine)] hover:text-[var(--wine)]'
                    )}
                  >
                    {category.name}
                    <span className={cn('ml-1.5 rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-[var(--secondary)]')}>
                      {count}
                    </span>
                  </motion.button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {productsError ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] py-16 text-center">
          <p className="font-medium text-[var(--foreground)]">Não foi possível carregar o cardápio.</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Tente novamente em instantes.</p>
        </div>
      ) : (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <ProductSkeleton />
              </motion.div>
            ))
          : (
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                  transition={{
                    delay: Math.min(i * 0.04, 0.3),
                    duration: 0.38,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="h-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          )
        }
      </div>
      )}

      {!productsError && !isLoading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg font-medium text-[var(--foreground)]">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {search ? `Sem resultados para "${search}"` : 'Nenhum produto nesta categoria'}
          </p>
          {(search || selectedCategory) && (
            <Button
              variant="outline"
              className="mt-4 border-[var(--border)]"
              onClick={() => { setSearch(''); setSelectedCategory(null) }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
