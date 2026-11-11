import pb from '@/lib/pocketbase/client'
import { normalizeBrPhone } from '@/lib/phone'

/** Extrai o telefone normalizado de um contato (campo phone ou parte numérica do remote_jid). */
const contactDigits = (contact: any): string => {
  const fromPhone = normalizeBrPhone(contact?.phone)
  if (fromPhone) return fromPhone
  const jidNumber = String(contact?.remote_jid || '').split('@')[0]
  return normalizeBrPhone(jidNumber) || ''
}

/** Procura, entre os contatos já carregados, o que corresponde ao telefone normalizado. */
export const findContactByPhone = (contacts: any[], normalizedPhone: string) =>
  contacts.find((c) => contactDigits(c) === normalizedPhone) || null

/** Procura no banco um contato do usuário pelo remote_jid 55DDDNUMERO@s.whatsapp.net. */
export const findContactByJid = async (normalizedPhone: string) => {
  try {
    return await pb
      .collection('whatsapp_contacts')
      .getFirstListItem(`remote_jid = '${normalizedPhone}@s.whatsapp.net'`, { $autoCancel: false })
  } catch {
    return null
  }
}

/**
 * Cria um contato em whatsapp_contacts para o telefone informado, vinculado à
 * instância do usuário logado. O remote_jid segue o formato 55DDDNUMERO@s.whatsapp.net.
 */
export const createContactForPhone = async (params: {
  normalizedPhone: string
  name: string
  instanceId: string
}) => {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('Usuário não autenticado')

  return await pb.collection('whatsapp_contacts').create(
    {
      instance_id: params.instanceId,
      user_id: userId,
      remote_jid: `${params.normalizedPhone}@s.whatsapp.net`,
      phone: params.normalizedPhone,
      name: params.name,
      agent_paused: false,
    },
    { $autoCancel: false },
  )
}
