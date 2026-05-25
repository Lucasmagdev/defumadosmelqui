import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customer, items, subtotal, deliveryFee, total, deliveryMethod, scheduledDate, scheduledTime, paymentMethod } = body

  const { data: existingCustomer } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('phone', customer.phone)
    .single()

  let customerId: string

  if (existingCustomer) {
    customerId = existingCustomer.id
    await supabaseAdmin
      .from('customers')
      .update({
        name: customer.name,
        email: customer.email,
        street: customer.address.street,
        number: customer.address.number,
        complement: customer.address.complement,
        neighborhood: customer.address.neighborhood,
        city: customer.address.city,
        state: customer.address.state,
        zip_code: customer.address.zipCode,
      })
      .eq('id', customerId)
  } else {
    const { data: newCustomer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        street: customer.address.street,
        number: customer.address.number,
        complement: customer.address.complement,
        neighborhood: customer.address.neighborhood,
        city: customer.address.city,
        state: customer.address.state,
        zip_code: customer.address.zipCode,
      })
      .select('id')
      .single()

    if (customerError) return NextResponse.json({ error: customerError.message }, { status: 500 })
    customerId = newCustomer.id
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: customerId,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      delivery_method: deliveryMethod,
      scheduled_date: scheduledDate || null,
      scheduled_time: scheduledTime || null,
      payment_method: paymentMethod,
      status: 'received',
    })
    .select('id')
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const orderItems = items.map((item: { product: { id: string; name: string; price: number }; quantity: number; observations: string }) => ({
    order_id: order.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_price: item.product.price,
    quantity: item.quantity,
    observations: item.observations || null,
  }))

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(orderItems)
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  return NextResponse.json({ orderId: order.id }, { status: 201 })
}
