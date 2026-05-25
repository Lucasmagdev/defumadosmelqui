import { Header } from '@/components/header'
import { CheckoutFlow } from '@/components/checkout-flow'

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Finalizar Pedido
        </h1>
        <CheckoutFlow />
      </main>
    </div>
  )
}
