import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, name, phone, email, address } = body

  const { data: existing } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .single()

  if (existing) {
    await supabaseAdmin
      .from('customers')
      .update({
        user_id: userId,
        name,
        email,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        zip_code: address.zipCode,
      })
      .eq('id', existing.id)

    return NextResponse.json({ id: existing.id })
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({
      user_id: userId,
      name,
      phone,
      email,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zip_code: address.zipCode,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
