import pb from '@/lib/pocketbase/client'

export interface MentoriaPeriodoRecord {
  id: string
  client_id: string
  start_date: string
  end_date: string
  renewal_info: string
  mentor_id: string
  created: string
  updated: string
}

export const getMentoriaPeriodos = async (clientId: string): Promise<MentoriaPeriodoRecord[]> => {
  return await pb.collection('mentoria_periodos').getFullList({
    filter: `client_id = "${clientId}"`,
    sort: '-created',
  })
}

export const createMentoriaPeriodo = async (
  data: Partial<MentoriaPeriodoRecord>,
): Promise<MentoriaPeriodoRecord> => {
  return await pb.collection('mentoria_periodos').create(data)
}
