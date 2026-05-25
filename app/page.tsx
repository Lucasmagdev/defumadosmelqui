import { Header } from '@/components/header'
import { ProductCatalog } from '@/components/product-catalog'
import { Flame } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[var(--wine)]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="flex items-center gap-2 text-[var(--gold)]">
            <Flame className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Defumados Artesanais</span>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl" style={{ fontFamily: 'var(--font-playfair)' }}>
            <span className="text-balance">Carnes Defumadas</span>
            <br />
            <span className="text-[var(--gold)]">Premium</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Tradição e sabor em cada pedaço. Nossas carnes são defumadas por horas em madeira nobre para um resultado incomparável.
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              Aceitando pedidos
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-bold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-playfair)' }}>
            Nosso Cardápio
          </h2>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Selecione os produtos e adicione ao carrinho
          </p>
        </div>
        <ProductCatalog />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--off-white)]">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wine)]">
                <Flame className="h-4 w-4 text-[var(--gold)]" />
              </div>
              <span className="font-bold text-[var(--wine)]">Lima&apos;s Meat Market</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
              <a href="/admin" className="hover:text-[var(--wine)]">Painel Admin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
