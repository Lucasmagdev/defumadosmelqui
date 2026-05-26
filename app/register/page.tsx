'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flame, MapPin, Eye, EyeOff } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { maskPhone, maskCep } from '@/lib/masks'
import { STORE_COUNTRY } from '@/lib/currency'

const isUnitedStates = STORE_COUNTRY === 'US'
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: isUnitedStates ? z.string().optional() : z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(isUnitedStates ? 5 : 8, isUnitedStates ? 'ZIP Code inválido' : 'CEP inválido'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createSupabaseBrowserClient()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true)
    setError('')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name, phone: data.phone },
      },
    })

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'E-mail já cadastrado. Faça login.'
        : signUpError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const customerRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: {
            street: data.street,
            number: data.number,
            complement: data.complement,
            neighborhood: data.neighborhood || '',
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
          },
        }),
      })
      if (!customerRes.ok && authData.session) {
        setError('Conta criada, mas nao foi possivel salvar o endereco.')
        setLoading(false)
        return
      }
    }

    router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-8 w-8 text-[var(--wine)]" />
            <span className="font-serif text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Melqui Fumados
            </span>
          </div>
        </div>

        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Criar Conta</CardTitle>
            <CardDescription>Cadastre-se para acompanhar seus pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    className="border-[var(--border)]"
                    {...register('name')}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    placeholder={isUnitedStates ? '(555) 555-1234' : '(11) 99999-9999'}
                    className="border-[var(--border)]"
                    {...register('phone')}
                    onChange={(e) => {
                      e.target.value = maskPhone(e.target.value)
                      register('phone').onChange(e)
                    }}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="border-[var(--border)]"
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    className="border-[var(--border)] pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <Separator className="my-4 bg-[var(--border)]" />

              <h3 className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                <MapPin className="h-4 w-4 text-[var(--wine)]" />
                Endereço de Entrega
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    placeholder={isUnitedStates ? 'Main Street' : 'Rua das Flores'}
                    className="border-[var(--border)]"
                    {...register('street')}
                  />
                  {errors.street && <p className="text-sm text-red-500">{errors.street.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    className="border-[var(--border)]"
                    {...register('number')}
                  />
                  {errors.number && <p className="text-sm text-red-500">{errors.number.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    placeholder="Apt 12, Bloco A"
                    className="border-[var(--border)]"
                    {...register('complement')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{isUnitedStates ? 'Bairro (opcional)' : 'Bairro *'}</Label>
                  <Input
                    id="neighborhood"
                    placeholder={isUnitedStates ? 'Neighborhood' : 'Centro'}
                    className="border-[var(--border)]"
                    {...register('neighborhood')}
                  />
                  {errors.neighborhood && <p className="text-sm text-red-500">{errors.neighborhood.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder={isUnitedStates ? 'Orlando' : 'São Paulo'}
                    className="border-[var(--border)]"
                    {...register('city')}
                  />
                  {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    placeholder={isUnitedStates ? 'FL' : 'SP'}
                    className="border-[var(--border)]"
                    {...register('state')}
                  />
                  {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">{isUnitedStates ? 'ZIP Code' : 'CEP'} *</Label>
                  <Input
                    id="zipCode"
                    placeholder={isUnitedStates ? '00000' : '01234-567'}
                    className="border-[var(--border)]"
                    {...register('zipCode')}
                    onChange={(e) => {
                      e.target.value = maskCep(e.target.value)
                      register('zipCode').onChange(e)
                    }}
                  />
                  {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode.message}</p>}
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>

              <p className="text-center text-sm text-[var(--muted-foreground)]">
                Já tem conta?{' '}
                <Link href="/login" className="text-[var(--wine)] hover:underline">
                  Entrar
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
