import pb from '@/lib/pocketbase/client'

export interface CsvImportResult {
  ok: boolean
  imported: number
  errors: number
  clientesSynced: number
}

export async function importHotmartCsv(csvText: string): Promise<CsvImportResult> {
  // ATENÇÃO: Revertendo para enviar texto em vez de tentar enviar array JSON falho
  return pb.send('/backend/v1/hotmart/import-csv', {
    method: 'POST',
    body: JSON.stringify({ csv: csvText }),
    headers: { 'Content-Type': 'application/json' },
  })
}
