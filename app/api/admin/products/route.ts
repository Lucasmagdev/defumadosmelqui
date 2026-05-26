import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data: maxRow } = await supabaseAdmin
    .from('products')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .single()
  const nextOrder = ((maxRow?.display_order as number) ?? 0) + 1

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      image_url: body.imageUrl,
      video_url: body.videoUrl || null,
      available: body.available ?? true,
      featured: body.featured ?? false,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
