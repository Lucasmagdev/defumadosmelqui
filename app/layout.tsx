import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
})

const sourceSans = Source_Sans_3({ 
  subsets: ["latin"],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Lima's Meat Market | Carnes Defumadas Premium",
  description: 'As melhores carnes defumadas artesanais. Brisket, pulled pork, costela e muito mais. Peça agora!',
  keywords: ['churrasco', 'carne defumada', 'brisket', 'bbq', 'açougue'],
}

export const viewport: Viewport = {
  themeColor: '#6E1522',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${sourceSans.variable} bg-[var(--background)]`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
