'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Flame, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdminMode = searchParams.get('admin') === '1'
  const [activeTab, setActiveTab] = useState(isAdminMode ? 'admin' : 'cliente')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createSupabaseBrowserClient()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    setActiveTab(isAdminMode ? 'admin' : 'cliente')
    reset()
    setError('')
  }, [isAdminMode, reset])

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      setError('E-mail ou senha inválidos')
      setLoading(false)
      return
    }

    const role = authData.user?.user_metadata?.role

    if (activeTab === 'admin') {
      if (role !== 'admin') {
        await supabase.auth.signOut()
        setError('Acesso negado. Conta sem permissão de administrador.')
        setLoading(false)
        return
      }
      router.push('/admin')
    } else {
      if (role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Flame className="h-8 w-8 text-[var(--wine)]" />
            <span className="font-serif text-2xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Melqui Fumados
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); reset(); setError('') }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
            <TabsTrigger value="admin">Administrador</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Entrar como Cliente</CardTitle>
                <CardDescription>Acesse sua conta para acompanhar pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-cliente">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="email-cliente"
                        type="email"
                        placeholder="seu@email.com"
                        className="border-[var(--border)] pl-10"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-cliente">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="password-cliente"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="border-[var(--border)] pl-10 pr-10"
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

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>

                  <p className="text-center text-sm text-[var(--muted-foreground)]">
                    Não tem conta?{' '}
                    <Link href="/register" className="text-[var(--wine)] hover:underline">
                      Cadastre-se
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="border-[var(--border)] bg-[var(--card)]">
              <CardHeader>
                <CardTitle className="text-[var(--foreground)]">Área Administrativa</CardTitle>
                <CardDescription>Acesso restrito a administradores</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-admin">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="email-admin"
                        type="email"
                        placeholder="admin@melquifumados.com"
                        className="border-[var(--border)] pl-10"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-admin">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                      <Input
                        id="password-admin"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="border-[var(--border)] pl-10 pr-10"
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

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
                  >
                    {loading ? 'Entrando...' : 'Entrar no Admin'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
