'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { ArrowRight, Clock3, Flame, MapPin, ShieldCheck } from 'lucide-react'
import { SplitText } from '@/components/split-text'
import { MagneticButton } from '@/components/magnetic-button'

const ease = [0.25, 0.1, 0.25, 1] as const

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease, delay } },
})

const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.7, ease, delay } },
})

export function HeroSection() {
  const [hovering, setHovering] = useState(false)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlight = useMotionTemplate`radial-gradient(650px circle at ${mouseX}px ${mouseY}px, rgba(148,126,56,0.13), transparent 70%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <section
      className="grain relative isolate overflow-hidden bg-[var(--wine)]"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Background photo */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947?w=1920&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#320b12]/95 via-[var(--wine)]/85 to-[var(--wine)]/35" />

      {/* Spotlight cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: spotlight }}
        animate={{ opacity: hovering ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[minmax(420px,1fr)_380px] lg:py-28">
        {/* Left col */}
        <div>
          <motion.div
            {...fadeIn(0)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-black/10 px-4 py-2 text-[var(--gold)] backdrop-blur-sm"
          >
            <Flame className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em]">Defumados Artesanais</span>
          </motion.div>

          {/* Split text title */}
          <h1
            className="mt-6 max-w-2xl font-serif text-[2.6rem] font-bold leading-[1.06] sm:text-6xl lg:text-[4rem]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            <SplitText
              text="Carnes defumadas lentamente,"
              className="text-white"
              delay={0.05}
              stagger={0.055}
            />
            {' '}
            <SplitText
              text="servidas no ponto."
              className="text-[var(--gold)]"
              delay={0.05 + 5 * 0.055 + 0.1}
              stagger={0.055}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease }}
            className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg"
          >
            Costela, brisket e cortes premium preparados por horas em madeira nobre.
            Escolha seu pedido e receba com sabor de churrasco de verdade.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.5, ease }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <MagneticButton>
              <Link
                href="#cardapio"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--gold)] px-7 text-sm font-bold text-white shadow-lg shadow-[var(--gold)]/30 transition-all hover:bg-[#a79047] hover:shadow-xl hover:shadow-[var(--gold)]/40 active:scale-95"
              >
                Ver cardápio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </MagneticButton>

            <MagneticButton strength={0.2}>
              <Link
                href="/meus-pedidos"
                className="inline-flex h-12 items-center rounded-full border border-white/25 bg-white/[0.07] px-7 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 active:scale-95"
              >
                Acompanhar pedido
              </Link>
            </MagneticButton>
          </motion.div>
        </div>

        {/* Right col — info card (desktop only) */}
        <motion.div
          {...slideRight(0.4)}
          className="hidden rounded-2xl border border-white/15 bg-white/[0.07] p-6 text-white shadow-2xl backdrop-blur-sm lg:block"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
            Aceitando pedidos agora
          </div>
          <p className="mt-2 text-sm text-white/60">Prepare seu pedido em poucos passos.</p>
          <div className="mt-6 space-y-4">
            {[
              { icon: Clock3, text: 'Preparo artesanal e acompanhamento online' },
              { icon: MapPin, text: 'Entrega ou retirada, você escolhe' },
              { icon: ShieldCheck, text: 'Pagamento seguro no checkout' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.1, duration: 0.45, ease }}
                className="flex items-center gap-3"
              >
                <Icon className="h-5 w-5 flex-shrink-0 text-[var(--gold)]" />
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
