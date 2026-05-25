import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('total, order_items(*)')
    .gte('created_at', todayStr)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const todayOrders = orders || []
  const revenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0)
  const averageTicket = todayOrders.length > 0 ? revenue / todayOrders.length : 0

  const productCounts: Record<string, { name: string; count: number }> = {}
  todayOrders.forEach((order) => {
    order.order_items?.forEach((item: { product_id: string; product_name: string; quantity: number }) => {
      if (!productCounts[item.product_id]) {
        productCounts[item.product_id] = { name: item.product_name, count: 0 }
      }
      productCounts[item.product_id].count += item.quantity
    })
  })
  const bestSelling = Object.values(productCounts).sort((a, b) => b.count - a.count)[0] || null

  return NextResponse.json({
    ordersCount: todayOrders.length,
    revenue,
    averageTicket,
    bestSelling,
  })
}
