import pb from '@/lib/pocketbase/client'

export interface LeadRecord {
  id: string
  name: string
  email: string
  phone: string
  vend_resp: string
  etapa_pipeline: string
  int_perito: string
  area_grad: string
  tmp_acad: string
  renda: string
  score_comerc: number
  motivo_perda: string
  historico_notas: string
  concurso_alvo: string
  tmp_estudos: string
  hrs_est_dia: string
  maior_dif: string
  top_obj: string
  inv_prep: string
  dias_ment: string[]
  tags: string
  mentoria: boolean
  created: string
  updated: string
}

export const getLeads = async (): Promise<LeadRecord[]> => {
  return await pb.collection('Leads').getFullList({ sort: '-created', expand: 'vend_resp' })
}

export const getLead = async (id: string): Promise<LeadRecord> => {
  return await pb.collection('Leads').getOne(id)
}

export const createLead = async (data: Partial<LeadRecord>): Promise<LeadRecord> => {
  return await pb.collection('Leads').create(data)
}

export const updateLead = async (id: string, data: Partial<LeadRecord>): Promise<LeadRecord> => {
  return await pb.collection('Leads').update(id, data)
}

export const deleteLead = async (id: string): Promise<void> => {
  await pb.collection('Leads').delete(id)
}
