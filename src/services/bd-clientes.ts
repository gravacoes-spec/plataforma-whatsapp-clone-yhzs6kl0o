import pb from '@/lib/pocketbase/client'

export interface BdClienteRecord {
  id: string
  Aluno_a: string
  Mentor_a: string
  Telefone: string
  email: string
  Cidade: string
  UF: string
  CEP: string
  Vend_Resp_Lead: string
  Vend_Resp_User: string
  Nome_Prod: string
  Tp_Pgto: string
  Vlr_Pago: number
  Data_inicio: string
  Data_term: string
  Renov: string
  area_grad: string
  concurso_alvo: string
  tmp_estudos: string
  hrs_est_dia: string
  maior_dif: string
  top_obj: string
  created: string
  updated: string
}

export const getBdClientes = async (): Promise<BdClienteRecord[]> => {
  return await pb.collection('bd_clientes').getFullList({ sort: '-created' })
}

export const getBdCliente = async (id: string): Promise<BdClienteRecord> => {
  return await pb.collection('bd_clientes').getOne(id)
}

export const createBdCliente = async (data: Partial<BdClienteRecord>): Promise<BdClienteRecord> => {
  return await pb.collection('bd_clientes').create(data)
}

export const updateBdCliente = async (
  id: string,
  data: Partial<BdClienteRecord>,
): Promise<BdClienteRecord> => {
  return await pb.collection('bd_clientes').update(id, data)
}

export const deleteBdCliente = async (id: string): Promise<void> => {
  await pb.collection('bd_clientes').delete(id)
}
