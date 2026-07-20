import pb from '@/lib/pocketbase/client'

export interface MetaRecord {
  id: string
  vend_resp: string
  periodo_in: string
  periodo_fin: string
  m_leads_recebidos: number
  m_abord_prospec_ativa: number
  m_apresent_consult: number
  m_vendas: number
  m_faturamento: number
  r_leads_recebidos: number
  r_abord_prospec_ativa: number
  r_apresent_consult: number
  r_vendas: number
  r_faturamento: number
  ajuste_vendas: number
  ajuste_faturamento: number
  ajuste_leads: number
  ajuste_abordagens: number
  ajuste_consultorias: number
  created: string
  updated: string
}

export const getMetas = async (): Promise<MetaRecord[]> => {
  return await pb.collection('Metas').getFullList({ sort: '-created' })
}

export const getMeta = async (id: string): Promise<MetaRecord> => {
  return await pb.collection('Metas').getOne(id)
}

export const createMeta = async (data: Partial<MetaRecord>): Promise<MetaRecord> => {
  return await pb.collection('Metas').create(data)
}

export const updateMeta = async (id: string, data: Partial<MetaRecord>): Promise<MetaRecord> => {
  return await pb.collection('Metas').update(id, data)
}

export const deleteMeta = async (id: string): Promise<void> => {
  await pb.collection('Metas').delete(id)
}
