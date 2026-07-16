import pb from '@/lib/pocketbase/client'

export interface BdMentorRecord {
  id: string
  nome: string
  email: string
  phone: string
  aluno_vinculado: string
  ativo: boolean
  created: string
  updated: string
}

export const getMentors = async (): Promise<BdMentorRecord[]> => {
  return await pb.collection('bd_mentor').getFullList({ sort: '-created' })
}

export const getMentor = async (id: string): Promise<BdMentorRecord> => {
  return await pb.collection('bd_mentor').getOne(id)
}

export const createMentor = async (data: Partial<BdMentorRecord>): Promise<BdMentorRecord> => {
  return await pb.collection('bd_mentor').create(data)
}

export const updateMentor = async (
  id: string,
  data: Partial<BdMentorRecord>,
): Promise<BdMentorRecord> => {
  return await pb.collection('bd_mentor').update(id, data)
}

export const deleteMentor = async (id: string): Promise<void> => {
  await pb.collection('bd_mentor').delete(id)
}
