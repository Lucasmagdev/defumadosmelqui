export function maskPhone(value: string): string {
  const isUnitedStates = (process.env.NEXT_PUBLIC_STORE_COUNTRY || 'US') === 'US'
  const digits = value.replace(/\D/g, '').slice(0, isUnitedStates ? 10 : 11)
  if (isUnitedStates) {
    if (digits.length <= 3) return digits.length ? `(${digits}` : ''
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function maskCep(value: string): string {
  const isUnitedStates = (process.env.NEXT_PUBLIC_STORE_COUNTRY || 'US') === 'US'
  const digits = value.replace(/\D/g, '').slice(0, isUnitedStates ? 9 : 8)
  if (isUnitedStates) {
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export async function lookupCep(cep: string): Promise<{
  logradouro: string
  bairro: string
  localidade: string
  uf: string
} | null> {
  if ((process.env.NEXT_PUBLIC_STORE_COUNTRY || 'US') === 'US') return null
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await res.json()
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}
