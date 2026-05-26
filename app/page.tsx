import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { MarqueeStrip } from '@/components/marquee-strip'
import { StatsStrip } from '@/components/stats-strip'
import { ProductCatalog } from '@/components/product-catalog'
import { FloatingCart } from '@/components/floating-cart'
import Link from 'next/link'
import { Flame } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <HeroSection />
      <MarqueeStrip />
      <StatsStrip />

      {/* Catalog Section */}
      <main id="cardapio" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-12 sm:py-16">
        <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
              Peça online
            </p>
            <h2
              className="mt-2 font-serif text-3xl font-bold text-[var(--foreground)] sm:text-4xl"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Nosso Cardápio
            </h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Escolha seus cortes favoritos e monte o pedido.
            </p>
          </div>
          <p className="max-w-xs rounded-full bg-[var(--off-white)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
            Retirada ou delivery disponível
          </p>
        </div>
        <ProductCatalog />
      </main>

      {/* Footer */}
      <footer className="grain border-t border-white/10 bg-[var(--wine)]">
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Flame className="h-5 w-5 text-[var(--gold)]" />
              </div>
              <div>
                <p className="font-bold text-white">Melqui Fumados</p>
                <p className="text-xs text-white/50">Defumados artesanais</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/55">
              <Link href="/#cardapio" className="transition hover:text-white">Cardápio</Link>
              <Link href="/meus-pedidos" className="transition hover:text-white">Meus pedidos</Link>
            </div>
          </div>
        </div>
      </footer>

      <FloatingCart />
    </div>
  )
}
