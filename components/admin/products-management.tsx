'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pencil, Trash2, Plus, Search } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { Product, Category } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    category: row.category as string,
    imageUrl: (row.image_url as string) || '',
    videoUrl: row.video_url as string | undefined,
    available: row.available as boolean,
  }
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)

export function ProductsManagement() {
  const { data: rawProducts = [] } = useSWR<Record<string, unknown>[]>('/api/admin/products', fetcher)
  const { data: categories = [] } = useSWR<Category[]>('/api/categories', fetcher)
  const products = rawProducts.map(mapProduct)

  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', description: '', price: 0, category: '', imageUrl: '', videoUrl: '', available: true,
  })

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search.toLowerCase())
  )

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData(product)
    } else {
      setEditingProduct(null)
      setFormData({ name: '', description: '', price: 0, category: '', imageUrl: '', videoUrl: '', available: true })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products'
      const method = editingProduct ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      await mutate('/api/admin/products')
      await mutate('/api/products')
      toast.success(editingProduct ? 'Produto atualizado!' : 'Produto adicionado!')
      setIsDialogOpen(false)
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remover produto?')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await mutate('/api/admin/products')
      await mutate('/api/products')
      toast.success('Produto removido!')
    } else {
      toast.error('Erro ao remover produto')
    }
  }

  const toggleAvailability = async (product: Product) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, available: !product.available }),
    })
    await mutate('/api/admin/products')
    await mutate('/api/products')
  }

  return (
    <>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[var(--foreground)]">
              Produtos <span className="text-sm font-normal text-[var(--muted-foreground)]">({filtered.length})</span>
            </CardTitle>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[var(--border)] pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] space-y-4 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-[var(--muted-foreground)]">Nenhum produto encontrado</p>
            ) : (
              filtered.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={product.imageUrl || '/placeholder.jpg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold text-[var(--foreground)]">{product.name}</h3>
                      <Badge
                        className={product.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {product.available ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-[var(--muted-foreground)]">{product.description}</p>
                    <p className="text-sm font-medium text-[var(--wine)]">{formatPrice(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={product.available} onCheckedChange={() => toggleAvailability(product)} />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(product)}
                      className="border-[var(--border)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      className="border-[var(--border)] text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-[var(--background)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Image preview */}
            {formData.imageUrl && (
              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-[var(--border)]">
                <Image
                  src={formData.imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => {}}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-[var(--border)]"
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-[var(--border)]"
                placeholder="Descrição do produto"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="border-[var(--border)]"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger className="border-[var(--border)]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL da Imagem</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="border-[var(--border)]"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>URL do Vídeo (opcional)</Label>
              <Input
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="border-[var(--border)]"
                placeholder="https://youtube.com/embed/..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Disponível para venda</Label>
              <Switch
                checked={formData.available}
                onCheckedChange={(v) => setFormData({ ...formData, available: v })}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-[var(--border)]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
