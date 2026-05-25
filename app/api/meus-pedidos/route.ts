import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/supabase-server'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!customer) return NextResponse.json([])

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
