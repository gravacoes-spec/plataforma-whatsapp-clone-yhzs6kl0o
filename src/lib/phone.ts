/**
 * Normaliza um telefone brasileiro para o formato internacional usado pelo WhatsApp:
 * 55 + DDD + número, somente dígitos (ex.: 5561999999999).
 * Aceita máscaras, espaços, traços, parênteses, "+", zero de tronco e DDI 55 já presente.
 * Retorna null quando não for possível obter um número válido.
 */
export function normalizeBrPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null

  // Já tem DDI 55 + DDD + número (12 ou 13 dígitos)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits
  }

  // Remove zero de tronco (ex.: 0 61 9999-9999)
  if ((digits.length === 11 || digits.length === 12) && digits.startsWith('0')) {
    digits = digits.slice(1)
    if (digits.length === 12 || digits.length === 13) {
      if (digits.startsWith('55')) return digits
    }
  }

  // DDD + número (10 ou 11 dígitos) → adiciona DDI 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`
  }

  return null
}

/** Formata um telefone normalizado para exibição: +55 (61) 99999-9999 */
export function formatBrPhone(normalized: string): string {
  const d = normalized.replace(/\D/g, '')
  const local = d.startsWith('55') && d.length >= 12 ? d.slice(2) : d
  const ddd = local.slice(0, 2)
  const rest = local.slice(2)
  if (rest.length === 9) return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
  if (rest.length === 8) return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `+${d}`
}
