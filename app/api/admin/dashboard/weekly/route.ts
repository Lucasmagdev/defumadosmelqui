import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const start = days[0].toISOString()

  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('total, created_at, status')
    .gte('created_at', start)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const weekly = days.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const dayOrders = (orders || []).filter((o) => {
      const d = new Date(o.created_at)
      return d >= day && d < next
    })
    return {
      day: dayLabels[day.getDay()],
      date: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0),
      orders: dayOrders.length,
    }
  })

  const statusCounts: Record<string, number> = {}
  ;(orders || []).forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })

  return NextResponse.json({ weekly, statusCounts })
}
