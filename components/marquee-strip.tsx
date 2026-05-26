'use client'

const ITEMS = [
  'Brisket', 'Costela', 'Pulled Pork', 'Linguiça Artesanal',
  'Picanha Premium', 'Combo BBQ', 'Defumados na Brasa', 'Ancho Angus',
]

export function MarqueeStrip() {
  const repeated = [...ITEMS, ...ITEMS, ...ITEMS]

  return (
    <div className="overflow-hidden border-y border-white/10 bg-[var(--wine)] py-3.5">
      <div className="flex w-max animate-marquee items-center gap-0 whitespace-nowrap will-change-transform">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-5 px-5">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/75">
              {item}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--gold)]" />
          </span>
        ))}
      </div>
    </div>
  )
}
