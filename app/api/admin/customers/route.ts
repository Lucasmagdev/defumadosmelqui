import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data: customers, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('customer_id, total, order_items(*)')

  const enriched = customers.map((c) => {
    const customerOrders = orders?.filter((o) => o.customer_id === c.id) || []
    const totalSpent = customerOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const averageTicket = customerOrders.length > 0 ? totalSpent / customerOrders.length : 0

    const productCounts: Record<string, { name: string; count: number }> = {}
    customerOrders.forEach((order) => {
      order.order_items?.forEach((item: { product_id: string; product_name: string; quantity: number }) => {
        if (!productCounts[item.product_id]) {
          productCounts[item.product_id] = { name: item.product_name, count: 0 }
        }
        productCounts[item.product_id].count += item.quantity
      })
    })
    const favorites = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return { ...c, orderCount: customerOrders.length, totalSpent, averageTicket, favorites }
  })

  return NextResponse.json(enriched)
}
