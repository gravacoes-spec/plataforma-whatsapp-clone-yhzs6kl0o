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
