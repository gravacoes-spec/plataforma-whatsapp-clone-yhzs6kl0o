import pb from '@/lib/pocketbase/client'

export const getWebhookLogs = async () => {
  return await pb.collection('webhook_log').getList(1, 10, { sort: '-created' })
}

export const getVendasByLead = async (leadId: string) => {
  return await pb.collection('vendas_hotmart').getFullList({
    filter: `lead_id = "${leadId}"`,
    sort: '-created',
  })
}

export const getVendasByLeadAndEmail = async (leadId: string, email?: string) => {
  const parts = []
  if (leadId) parts.push(`lead_id = "${leadId}"`)
  if (email) parts.push(`email_comprador = "${email}"`)
  if (parts.length === 0) return []
  return await pb.collection('vendas_hotmart').getFullList({
    filter: parts.join(' || '),
    sort: '-created',
  })
}
