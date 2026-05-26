'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { Flame, Clock, Star, ShoppingBag } from 'lucide-react'

interface StatProps {
  value: number
  suffix?: string
  prefix?: string
  label: string
  icon: React.ReactNode
  delay?: number
}

function AnimatedStat({ value, suffix = '', prefix = '', label, icon, delay = 0 }: StatProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 50, damping: 18 })
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '-60px' })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => motionValue.set(value), delay * 1000)
      return () => clearTimeout(timer)
    }
  }, [isInView, value, motionValue, delay])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = prefix + Math.round(v).toLocaleString('pt-BR') + suffix
      }
    })
  }, [spring, suffix, prefix])

  return (
    <div className="group flex flex-col items-center gap-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--wine)]/10 text-[var(--wine)] transition-colors group-hover:bg-[var(--wine)] group-hover:text-white">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          <span ref={ref}>0</span>
        </p>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{label}</p>
      </div>
    </div>
  )
}

export function StatsStrip() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--off-white)] py-12 sm:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-4 sm:grid-cols-4 sm:gap-6">
        <AnimatedStat value={14} suffix="h+" label="Defumação mínima" icon={<Clock className="h-5 w-5" />} delay={0} />
        <AnimatedStat value={500} suffix="+" label="Pedidos entregues" icon={<ShoppingBag className="h-5 w-5" />} delay={0.1} />
        <AnimatedStat value={100} suffix="%" label="Artesanal" icon={<Star className="h-5 w-5" />} delay={0.2} />
        <AnimatedStat value={6} label="Cortes premium" icon={<Flame className="h-5 w-5" />} delay={0.3} />
      </div>
    </section>
  )
}
