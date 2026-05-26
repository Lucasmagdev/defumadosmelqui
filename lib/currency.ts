export const STORE_CURRENCY = process.env.NEXT_PUBLIC_STORE_CURRENCY || 'BRL'
export const STORE_LOCALE = process.env.NEXT_PUBLIC_STORE_LOCALE || 'pt-BR'
export const STORE_COUNTRY = process.env.NEXT_PUBLIC_STORE_COUNTRY || 'BR'
export const DELIVERY_FEE = Number(process.env.NEXT_PUBLIC_DELIVERY_FEE || 10)

export function formatCurrency(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(STORE_LOCALE, {
    style: 'currency',
    currency: STORE_CURRENCY,
    ...options,
  }).format(value)
}
