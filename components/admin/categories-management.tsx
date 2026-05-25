'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import useSWR, { mutate } from 'swr'
import { Category } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function toSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function CategoriesManagement() {
  const { data: categories = [] } = useSWR<Category[]>('/api/admin/categories', fetcher)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSlug('')
    setSlugManual(false)
    setIsDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setSlugManual(true)
    setIsDialogOpen(true)
  }

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slugManual) setSlug(toSlug(v))
  }

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Nome e slug são obrigatórios')
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      await mutate('/api/admin/categories')
      await mutate('/api/categories')
      toast.success(editing ? 'Categoria atualizada!' : 'Categoria criada!')
      setIsDialogOpen(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Erro ao excluir')
      return
    }
    await mutate('/api/admin/categories')
    await mutate('/api/categories')
    toast.success('Categoria excluída!')
  }

  return (
    <>
      <Card className="border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-[var(--foreground)]">
            Categorias{' '}
            <span className="text-sm font-normal text-[var(--muted-foreground)]">
              ({categories.length})
            </span>
          </CardTitle>
          <Button
            onClick={openCreate}
            className="bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="py-8 text-center text-[var(--muted-foreground)]">
              Nenhuma categoria cadastrada
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{cat.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">slug: {cat.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(cat)}
                      className="border-[var(--border)]"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(cat)}
                      className="border-[var(--border)] text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-sm bg-[var(--background)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--foreground)]">
              {editing ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="border-[var(--border)]"
                placeholder="Ex: Defumados Premium"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugManual(true) }}
                className="border-[var(--border)] font-mono text-sm"
                placeholder="defumados-premium"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Usado na URL e filtro — só letras, números e hífens
              </p>
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
