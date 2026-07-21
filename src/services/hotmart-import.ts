import pb from '@/lib/pocketbase/client'

export interface CsvImportResult {
  ok: boolean
  imported: number
  errors: number
  clientesSynced: number
}

export const importHotmartCsv = async (csvText: string): Promise<CsvImportResult> => {
  const baseUrl = (import.meta.env.VITE_POCKETBASE_URL || '').replace(/\/$/, '')
  const url = `${baseUrl}/backend/v1/hotmart/import-csv`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token || '',
    },
    body: JSON.stringify({ csv: csvText }),
  })

  if (!response.ok) {
    let message = `Importação falhou (${response.status})`
    try {
      const data = await response.json()
      message = data.message || data.error || message
    } catch {
      // Response body is not JSON
    }
    throw new Error(message)
  }

  try {
    return await response.json()
  } catch {
    throw new Error('Resposta inválida do servidor')
  }
}
