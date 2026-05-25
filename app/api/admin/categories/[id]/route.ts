import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, slug } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: 'name e slug obrigatórios' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('categories')
    .update({ name, slug })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { count } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category', id)

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Categoria possui ${count} produto(s). Mova os produtos antes de excluir.` },
      { status: 409 }
    )
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
