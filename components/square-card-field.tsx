'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export interface SquareTokenResult {
  status: string
  token?: string
  errors?: { message?: string }[]
}

export interface SquareCardHandle {
  tokenize: () => Promise<SquareTokenResult>
  destroy: () => Promise<boolean>
}

interface SquareCardFieldProps {
  applicationId: string
  locationId: string
  environment: 'sandbox' | 'production'
  onReady: (card: SquareCardHandle | null) => void
}

declare global {
  interface Window {
    Square?: {
      payments: (applicationId: string, locationId: string) => {
        card: () => Promise<SquareCardHandle & { attach: (selector: string) => Promise<void> }>
      }
    }
  }
}

export function SquareCardField({ applicationId, locationId, environment, onReady }: SquareCardFieldProps) {
  const [sdkReady, setSdkReady] = useState(false)
  const [error, setError] = useState('')
  const scriptSrc = environment === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js'

  useEffect(() => {
    if (!sdkReady || !window.Square) return
    let active = true
    let card: (SquareCardHandle & { attach: (selector: string) => Promise<void> }) | null = null

    const initializeCard = async () => {
      try {
        const payments = window.Square!.payments(applicationId, locationId)
        card = await payments.card()
        await card.attach('#square-card-container')
        if (active) onReady(card)
      } catch {
        if (active) setError('Nao foi possivel carregar o pagamento por cartao.')
      }
    }

    initializeCard()
    return () => {
      active = false
      onReady(null)
      card?.destroy()
    }
  }, [applicationId, locationId, onReady, sdkReady])

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <Script src={scriptSrc} strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Dados do cartao</p>
      <div id="square-card-container" />
      {!sdkReady && !error && <p className="text-sm text-[var(--muted-foreground)]">Carregando formulario seguro...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
