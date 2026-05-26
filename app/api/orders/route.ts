import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/supabase-server'
import { DELIVERY_FEE, STORE_COUNTRY, STORE_CURRENCY } from '@/lib/currency'

const deliveryMethods = new Set(['pickup', 'delivery'])
const paymentMethods = new Set(STORE_COUNTRY === 'US' ? ['square', 'cash'] : ['square', 'pix', 'cash'])

interface OrderInputItem {
  product?: { id?: string }
  quantity?: number
  observations?: string
}

async function chargeWithSquare(sourceId: string, amount: number, orderId: string) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN
  const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
  const environment = process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
  const currency = process.env.SQUARE_CURRENCY || STORE_CURRENCY
  if (!accessToken || !locationId) throw new Error('Pagamento Square nao configurado.')
  if (currency !== STORE_CURRENCY) throw new Error('Moeda da Square difere da moeda exibida na loja.')

  const apiBase = environment === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com'
  const response = await fetch(`${apiBase}/v2/payments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2026-05-20',
    },
    body: JSON.stringify({
      source_id: sourceId,
      idempotency_key: orderId,
      amount_money: { amount: Math.round(amount * 100), currency },
      location_id: locationId,
      reference_id: orderId,
      note: `Pedido ${orderId}`,
      autocomplete: true,
    }),
  })
  const result = await response.json()
  if (!response.ok) {
    const detail = result.errors?.[0]?.detail || 'Pagamento recusado pela Square.'
    throw new Error(detail)
  }
  return result.payment?.id as string | undefined
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customer, scheduledDate, scheduledTime } = body
  const deliveryMethod = String(body.deliveryMethod || '')
  const paymentMethod = String(body.paymentMethod || '')
  const items = Array.isArray(body.items) ? body.items as OrderInputItem[] : []

  if (!customer?.name || !customer?.phone || items.length === 0) {
    return NextResponse.json({ error: 'Dados do pedido incompletos.' }, { status: 400 })
  }
  if (!deliveryMethods.has(deliveryMethod) || !paymentMethods.has(paymentMethod)) {
    return NextResponse.json({ error: 'Forma de entrega ou pagamento invalida.' }, { status: 400 })
  }
  if (deliveryMethod === 'delivery' && (!customer.address?.street || !customer.address?.number || !customer.address?.zipCode)) {
    return NextResponse.json({ error: 'Endereco de entrega obrigatorio.' }, { status: 400 })
  }

  const quantities = items.map((item) => Number(item.quantity))
  if (quantities.some((quantity) => !Number.isInteger(quantity) || quantity < 1 || quantity > 99)) {
    return NextResponse.json({ error: 'Quantidade de produto invalida.' }, { status: 400 })
  }

  const productIds = [...new Set(items.map((item) => item.product?.id).filter((id): id is string => !!id))]
  if (productIds.length !== items.length) {
    return NextResponse.json({ error: 'Produtos invalidos no carrinho.' }, { status: 400 })
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, available')
    .in('id', productIds)

  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 })
  if (!products || products.length !== productIds.length || products.some((product) => !product.available)) {
    return NextResponse.json({ error: 'Um produto nao esta mais disponivel.' }, { status: 409 })
  }

  const productById = new Map(products.map((product) => [product.id, product]))
  const orderItems = items.map((item) => {
    const product = productById.get(item.product!.id!)!
    return {
      product_id: product.id,
      product_name: product.name,
      product_price: Number(product.price),
      quantity: Number(item.quantity),
      observations: item.observations?.trim() || null,
    }
  })
  const subtotal = orderItems.reduce((total, item) => total + item.product_price * item.quantity, 0)
  const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee
  const user = await getUser()

  if (paymentMethod === 'square' && !body.paymentToken) {
    return NextResponse.json({ error: 'Token de pagamento Square obrigatorio.' }, { status: 400 })
  }

  let existingCustomer: { id: string } | null = null
  if (user) {
    const { data } = await supabaseAdmin.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    existingCustomer = data
  }
  if (!existingCustomer) {
    const { data } = await supabaseAdmin.from('customers').select('id').eq('phone', customer.phone).maybeSingle()
    existingCustomer = data
  }

  const addressFields = deliveryMethod === 'delivery'
    ? {
        street: customer.address.street,
        number: customer.address.number,
        complement: customer.address.complement || null,
        neighborhood: customer.address.neighborhood,
        city: customer.address.city,
        state: customer.address.state,
        zip_code: customer.address.zipCode,
      }
    : {}

  let customerId: string
  if (existingCustomer) {
    customerId = existingCustomer.id
    const { error } = await supabaseAdmin
      .from('customers')
      .update({
        ...(user ? { user_id: user.id } : {}),
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        ...addressFields,
      })
      .eq('id', customerId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        ...(user ? { user_id: user.id } : {}),
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        street: deliveryMethod === 'delivery' ? customer.address.street : '',
        number: deliveryMethod === 'delivery' ? customer.address.number : '',
        complement: deliveryMethod === 'delivery' ? customer.address.complement || null : '',
        neighborhood: deliveryMethod === 'delivery' ? customer.address.neighborhood : '',
        city: deliveryMethod === 'delivery' ? customer.address.city : '',
        state: deliveryMethod === 'delivery' ? customer.address.state : '',
        zip_code: deliveryMethod === 'delivery' ? customer.address.zipCode : '',
      })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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

  const { error: itemsError } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })))
  if (itemsError) {
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  let paymentId: string | undefined
  if (paymentMethod === 'square') {
    try {
      paymentId = await chargeWithSquare(body.paymentToken, total, order.id)
    } catch (error) {
      await supabaseAdmin.from('order_items').delete().eq('order_id', order.id)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Falha no pagamento Square.' },
        { status: 402 },
      )
    }
  }

  const waPhone = process.env.WHATSAPP_PHONE
  const waApiKey = process.env.WHATSAPP_APIKEY
  if (waPhone && waApiKey) {
    const addr = deliveryMethod === 'delivery' && customer.address?.street
      ? `Delivery → ${customer.address.street}, ${customer.address.number}`
      : 'Retirada na loja'
    const lines = orderItems.map((i) => `• ${i.quantity}x ${i.product_name}`).join('\n')
    const msg = encodeURIComponent(
      `🔥 Novo pedido #${order.id.slice(0, 8).toUpperCase()}\n` +
      `Cliente: ${customer.name} | ${customer.phone}\n` +
      `${addr}\n` +
      `Pagamento: ${paymentMethod.toUpperCase()}\n` +
      `Total: ${STORE_CURRENCY} ${total.toFixed(2)}\n\n` +
      lines
    )
    fetch(`https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${msg}&apikey=${waApiKey}`).catch(() => {})
  }

  return NextResponse.json({ orderId: order.id, subtotal, deliveryFee, total, paymentId }, { status: 201 })
}
