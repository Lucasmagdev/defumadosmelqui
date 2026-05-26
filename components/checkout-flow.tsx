'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, MapPin, Store, Truck, CreditCard, Banknote, QrCode, CheckCircle, Loader2 } from 'lucide-react'
import { useCartStore, useCustomerStore, useCheckoutStore } from '@/lib/store'
import { maskPhone, maskCep, lookupCep } from '@/lib/masks'
import { DELIVERY_FEE, formatCurrency, STORE_COUNTRY } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SquareCardField, type SquareCardHandle } from '@/components/square-card-field'
import { cn } from '@/lib/utils'
import { Customer } from '@/lib/types'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const isUnitedStates = STORE_COUNTRY === 'US'

const baseSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  phone: z.string().min(14, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

const addressSchema = z.object({
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: isUnitedStates ? z.string().optional() : z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(isUnitedStates ? 5 : 8, isUnitedStates ? 'ZIP Code inválido' : 'CEP inválido'),
})

const customerSchema = baseSchema.merge(addressSchema.partial())

type CustomerFormData = z.infer<typeof customerSchema>

const squareApplicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID
const squareLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID
const squareEnvironment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
const squareConfigured = !!squareApplicationId && !!squareLocationId
const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
]

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
}

export function CheckoutFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [squareCard, setSquareCard] = useState<SquareCardHandle | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [direction, setDirection] = useState(1)
  const goTo = (next: number) => { setDirection(next > step ? 1 : -1); setStep(next) }

  const { items, getTotal, clearCart } = useCartStore()
  const { customer, setCustomer } = useCustomerStore()
  const { deliveryMethod, scheduledDate, scheduledTime, paymentMethod, setDeliveryMethod, setScheduledDate, setScheduledTime, setPaymentMethod, reset: resetCheckout } = useCheckoutStore()
  const isDelivery = deliveryMethod === 'delivery'
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      street: customer.address.street,
      number: customer.address.number,
      complement: customer.address.complement || '',
      neighborhood: customer.address.neighborhood,
      city: customer.address.city,
      state: customer.address.state,
      zipCode: customer.address.zipCode,
    } : {},
  })

  const handleCepBlur = async (cep: string) => {
    if (isUnitedStates) return
    setCepLoading(true)
    const data = await lookupCep(cep)
    if (data) {
      setValue('street', data.logradouro, { shouldValidate: true })
      setValue('neighborhood', data.bairro, { shouldValidate: true })
      setValue('city', data.localidade, { shouldValidate: true })
      setValue('state', data.uf, { shouldValidate: true })
    }
    setCepLoading(false)
  }

  const subtotal = getTotal()
  const deliveryFee = deliveryMethod === 'delivery' ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee

  const onCustomerSubmit = (data: CustomerFormData) => {
    const deliveryAddress = addressSchema.safeParse(data)
    if (isDelivery && !deliveryAddress.success) {
      deliveryAddress.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CustomerFormData
        setError(field, { message: issue.message })
      })
      return
    }

    const address = isDelivery && deliveryAddress.success
      ? { ...deliveryAddress.data, neighborhood: deliveryAddress.data.neighborhood || '' }
      : {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: '',
        }
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      address,
      createdAt: new Date(),
    }
    setCustomer(newCustomer)
    goTo(2)
  }

  const handleFinishOrder = async () => {
    if (!customer) return

    try {
      setPlacingOrder(true)
      let paymentToken: string | undefined
      if (paymentMethod === 'square') {
        if (!squareConfigured || !squareCard) throw new Error('Pagamento Square indisponivel.')
        const tokenResult = await squareCard.tokenize()
        if (tokenResult.status !== 'OK' || !tokenResult.token) {
          toast.error(tokenResult.errors?.[0]?.message || 'Confira os dados do cartao.')
          return
        }
        paymentToken = tokenResult.token
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items,
          subtotal,
          deliveryFee,
          total,
          deliveryMethod,
          scheduledDate: scheduledDate?.toISOString().split('T')[0] || null,
          scheduledTime: scheduledTime || null,
          paymentMethod,
          paymentToken,
        }),
      })

      if (!res.ok) {
        const response = await res.json().catch(() => ({}))
        throw new Error(response.error || 'Erro ao criar pedido')
      }

      const { orderId: newOrderId } = await res.json()
      setOrderId(newOrderId.slice(0, 8).toUpperCase())
      setShowSuccess(true)
      clearCart()
      resetCheckout()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setPlacingOrder(false)
    }
  }

  useEffect(() => {
    if (items.length === 0 && !showSuccess) router.replace('/carrinho')
  }, [items.length, router, showSuccess])

  useEffect(() => {
    if (!squareConfigured && paymentMethod === 'square') setPaymentMethod('cash')
    if (isUnitedStates && paymentMethod === 'pix') setPaymentMethod('cash')
  }, [paymentMethod, setPaymentMethod])

  if (items.length === 0 && !showSuccess) return null

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                step >= s
                  ? 'bg-[var(--wine)] text-white'
                  : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
              )}
            >
              {s}
            </div>
            <span className={cn(
              'hidden text-sm sm:block',
              step >= s ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
            )}>
              {s === 1 ? 'Dados' : s === 2 ? 'Entrega' : 'Pagamento'}
            </span>
            {s < 3 && (
              <div className={cn(
                'h-px w-8 transition-colors',
                step > s ? 'bg-[var(--wine)]' : 'bg-[var(--border)]'
              )} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
      {/* Step 1: Customer Data */}
      {step === 1 && (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Seus Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCustomerSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="border-[var(--border)]"
                    placeholder="Seu nome"
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    className="border-[var(--border)]"
                    placeholder={isUnitedStates ? '(555) 555-1234' : '(11) 99999-9999'}
                    onChange={(e) => {
                      e.target.value = maskPhone(e.target.value)
                      register('phone').onChange(e)
                    }}
                  />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className="border-[var(--border)]"
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              {/* Delivery method toggle — step 1 para saber se mostra endereço */}
              <Separator className="my-2 bg-[var(--border)]" />
              <div className="space-y-2">
                <Label>Forma de recebimento</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'pickup' as const, icon: Store, label: 'Retirada', sub: 'Busco na loja' },
                    { value: 'delivery' as const, icon: Truck, label: 'Delivery', sub: 'Recebo em casa' },
                  ].map(({ value, icon: Icon, label, sub }) => (
                    <div
                      key={label}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all',
                        deliveryMethod === value
                          ? 'border-[var(--wine)] bg-[var(--wine)]/5'
                          : 'border-[var(--border)] hover:border-[var(--gold)]'
                      )}
                      onClick={() => {
                        setDeliveryMethod(value)
                        if (value === 'pickup') {
                          clearErrors(['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipCode'])
                        }
                      }}
                    >
                      <Icon className="h-4 w-4 text-[var(--wine)]" />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address — só delivery */}
              {isDelivery && (
                <>
                  <Separator className="my-2 bg-[var(--border)]" />
                  <h3 className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                    <MapPin className="h-4 w-4 text-[var(--wine)]" />
                    Endereço de Entrega
                  </h3>

                  {/* CEP primeiro — autocomplete */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{isUnitedStates ? 'ZIP Code' : 'CEP'} *</Label>
                      <div className="relative">
                        <Input
                          id="zipCode"
                          {...register('zipCode')}
                          className="border-[var(--border)]"
                          placeholder={isUnitedStates ? '00000' : '00000-000'}
                          onChange={(e) => {
                            e.target.value = maskCep(e.target.value)
                            register('zipCode').onChange(e)
                          }}
                          onBlur={(e) => handleCepBlur(e.target.value)}
                        />
                        {cepLoading && (
                          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--muted-foreground)]" />
                        )}
                      </div>
                      {errors.zipCode && <p className="text-sm text-red-500">{errors.zipCode.message}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="street">Rua *</Label>
                      <Input
                        id="street"
                        {...register('street')}
                        className="border-[var(--border)]"
                        placeholder={isUnitedStates ? 'Nome da rua' : 'Preenchido pelo CEP'}
                      />
                      {errors.street && <p className="text-sm text-red-500">{errors.street.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input
                        id="number"
                        {...register('number')}
                        className="border-[var(--border)]"
                        placeholder="123"
                      />
                      {errors.number && <p className="text-sm text-red-500">{errors.number.message}</p>}
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        {...register('complement')}
                        className="border-[var(--border)]"
                        placeholder="Apt 12, Bloco A"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">{isUnitedStates ? 'Bairro (opcional)' : 'Bairro *'}</Label>
                      <Input
                        id="neighborhood"
                        {...register('neighborhood')}
                        className="border-[var(--border)]"
                        placeholder={isUnitedStates ? 'Neighborhood' : 'Centro'}
                      />
                      {errors.neighborhood && <p className="text-sm text-red-500">{errors.neighborhood.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        {...register('city')}
                        className="border-[var(--border)]"
                        placeholder={isUnitedStates ? 'Orlando' : 'São Paulo'}
                      />
                      {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{isUnitedStates ? 'Estado' : 'UF'} *</Label>
                      <Input
                        id="state"
                        {...register('state')}
                        className="border-[var(--border)]"
                        placeholder={isUnitedStates ? 'FL' : 'SP'}
                        maxLength={2}
                      />
                      {errors.state && <p className="text-sm text-red-500">{errors.state.message}</p>}
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
              >
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Delivery Options */}
      {step === 2 && (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Forma de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 rounded-lg border border-[var(--wine)] bg-[var(--wine)]/5 p-4">
              {deliveryMethod === 'delivery' ? (
                <Truck className="h-5 w-5 text-[var(--wine)]" />
              ) : (
                <Store className="h-5 w-5 text-[var(--wine)]" />
              )}
              <div className="flex-1">
                <p className="font-medium text-[var(--foreground)]">
                  {deliveryMethod === 'delivery' ? 'Delivery' : 'Retirada na Loja'}
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {deliveryMethod === 'delivery' ? 'Entrega no endereço informado' : 'Retire seu pedido em nossa loja'}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goTo(1)} className="text-[var(--wine)]">
                Alterar
              </Button>
            </div>

            <Separator className="bg-[var(--border)]" />

            <div className="space-y-4">
              <h3 className="font-semibold text-[var(--foreground)]">
                Agendar Pedido (opcional)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start border-[var(--border)] text-left font-normal',
                        !scheduledDate && 'text-[var(--muted-foreground)]'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate
                        ? format(scheduledDate, "dd 'de' MMMM", { locale: ptBR })
                        : 'Selecione a data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate || undefined}
                      onSelect={(date) => setScheduledDate(date || null)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select
                  value={scheduledTime || ''}
                  onValueChange={(v) => setScheduledTime(v || null)}
                >
                  <SelectTrigger className="border-[var(--border)]">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => goTo(1)}
                className="flex-1 border-[var(--border)]"
              >
                Voltar
              </Button>
              <Button
                onClick={() => goTo(3)}
                className="flex-1 bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
              >
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <Card className="border-[var(--border)] bg-[var(--card)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as 'square' | 'cash' | 'pix')}
              className="space-y-3"
            >
              <div
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 transition-all',
                  paymentMethod === 'square'
                    ? 'border-[var(--wine)] bg-[var(--wine)]/5'
                    : 'border-[var(--border)]',
                  squareConfigured ? 'cursor-pointer hover:border-[var(--gold)]' : 'cursor-not-allowed opacity-60'
                )}
                onClick={() => squareConfigured && setPaymentMethod('square')}
              >
                <RadioGroupItem value="square" id="square" disabled={!squareConfigured} />
                <CreditCard className="h-5 w-5 text-[var(--wine)]" />
                <div className="flex-1">
                  <Label htmlFor="square" className="cursor-pointer font-medium">
                    Cartão (Square)
                  </Label>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {squareConfigured ? 'Crédito ou débito via Square' : 'Disponível após configurar a conta Square'}
                  </p>
                </div>
              </div>

              {!isUnitedStates && (
                <div
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all',
                    paymentMethod === 'pix'
                      ? 'border-[var(--wine)] bg-[var(--wine)]/5'
                      : 'border-[var(--border)] hover:border-[var(--gold)]'
                  )}
                  onClick={() => setPaymentMethod('pix')}
                >
                  <RadioGroupItem value="pix" id="pix" />
                  <QrCode className="h-5 w-5 text-[var(--wine)]" />
                  <div className="flex-1">
                    <Label htmlFor="pix" className="cursor-pointer font-medium">
                      PIX
                    </Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Pagamento instantâneo via PIX
                    </p>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all',
                  paymentMethod === 'cash'
                    ? 'border-[var(--wine)] bg-[var(--wine)]/5'
                    : 'border-[var(--border)] hover:border-[var(--gold)]'
                )}
                onClick={() => setPaymentMethod('cash')}
              >
                <RadioGroupItem value="cash" id="cash" />
                <Banknote className="h-5 w-5 text-[var(--wine)]" />
                <div className="flex-1">
                  <Label htmlFor="cash" className="cursor-pointer font-medium">
                    Dinheiro
                  </Label>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Pague na entrega ou retirada
                  </p>
                </div>
              </div>
            </RadioGroup>

            {paymentMethod === 'square' && squareConfigured && squareApplicationId && squareLocationId && (
              <SquareCardField
                applicationId={squareApplicationId}
                locationId={squareLocationId}
                environment={squareEnvironment}
                onReady={setSquareCard}
              />
            )}

            <Separator className="bg-[var(--border)]" />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">Taxa de entrega</span>
                <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : 'Grátis'}</span>
              </div>
              <Separator className="bg-[var(--border)]" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-[var(--wine)]">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => goTo(2)}
                className="flex-1 border-[var(--border)]"
              >
                Voltar
              </Button>
              <Button
                onClick={handleFinishOrder}
                disabled={placingOrder}
                className="flex-1 bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
              >
                {placingOrder ? 'Finalizando...' : 'Finalizar Pedido'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        </motion.div>
      </AnimatePresence>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm bg-[var(--background)] text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              Pedido Realizado!
            </h2>
            <p className="text-[var(--muted-foreground)]">
              Seu pedido <span className="font-semibold text-[var(--wine)]">#{orderId}</span> foi recebido com sucesso.
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Você receberá atualizações sobre o status do seu pedido.
            </p>
            <Button
              onClick={() => {
                setShowSuccess(false)
                router.push('/')
              }}
              className="mt-4 w-full bg-[var(--wine)] text-white hover:bg-[var(--wine-dark)]"
            >
              Voltar ao Cardápio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
