import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest) {
  const items: { id: string; displayOrder: number }[] = await req.json()

  const updates = items.map(({ id, displayOrder }) =>
    supabaseAdmin.from('products').update({ display_order: displayOrder }).eq('id', id)
  )
  await Promise.all(updates)
  return NextResponse.json({ success: true })
}
