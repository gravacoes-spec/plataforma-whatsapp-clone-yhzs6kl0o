import pb from '@/lib/pocketbase/client'

export interface CsvImportResult {
  ok: boolean
  imported: number
  errors: number
  clientesSynced: number
}

export const importHotmartCsv = (csvText: string): Promise<CsvImportResult> =>
  pb.send('/backend/v1/hotmart/import-csv', {
    method: 'POST',
    body: JSON.stringify({ csv: csvText }),
    headers: { 'Content-Type': 'application/json' },
  })
