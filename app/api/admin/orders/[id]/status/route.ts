import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const statuses = new Set(['received', 'preparing', 'smoking', 'finished', 'out_for_delivery', 'delivered'])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()

  if (!statuses.has(status)) {
    return NextResponse.json({ error: 'Status invalido' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
