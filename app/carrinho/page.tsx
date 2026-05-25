import { Header } from '@/components/header'
import { CartView } from '@/components/cart-view'

export default function CarrinhoPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
          Seu Carrinho
        </h1>
        <CartView />
      </main>
    </div>
  )
}
