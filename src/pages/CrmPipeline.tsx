import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getLeads, updateLead, LeadRecord } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { PageHeader } from '@/components/ui/page-header'

const COLUMNS = [
  { id: 'Novo', title: 'Novo Lead' },
  { id: 'Contatado', title: 'Abordagem' },
  { id: '3. Lead Premium', title: 'Lead Premium' },
  { id: '4. Lead Qualificado', title: 'Lead Qualificado' },
  { id: '5. Lead em Nutrição', title: 'Lead em Nutrição' },
  { id: 'Apresentacao', title: 'Agendamento de Consultoria' },
  { id: 'Negociacao', title: 'Negociação' },
  { id: 'Ganho', title: 'Venda Realizada' },
  { id: 'Triagem / Qualificação', title: 'Follow-up' },
  { id: 'Perdido', title: 'Lead Desqualificado/Perda' },
]

export default function CrmPipeline() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const data = await getLeads()
      setLeads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('Leads', () => loadData())

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    )
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    if (!leadId) return

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa_pipeline: columnId } : l)))

    try {
      await updateLead(leadId, { etapa_pipeline: columnId })
    } catch (err) {
      console.error(err)
      loadData() // revert
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 overflow-hidden">
      <PageHeader
        title="Pipeline CRM"
        description="Acompanhe a jornada dos seus leads pelo funil de vendas em 10 etapas."
      />

      <div className="flex-1 overflow-x-auto px-8 pb-8">
        <div className="flex h-full min-w-max gap-4 items-start pt-2">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => (l.etapa_pipeline || 'Novo') === col.id)

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className="flex flex-col w-[280px] max-h-full shrink-0 rounded-xl bg-zinc-100/50 border border-zinc-200/60 overflow-hidden"
              >
                <div className="flex items-center justify-between px-3.5 py-3 shrink-0 bg-zinc-100/80">
                  <h3 className="font-semibold text-[13px] text-zinc-700">{col.title}</h3>
                  <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded bg-white border border-zinc-200 shadow-sm text-[11px] font-medium text-zinc-600">
                    {colLeads.length}
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="flex flex-col gap-2.5 px-2.5 pb-4 pt-2">
                    {colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="group flex flex-col p-3.5 bg-white rounded-lg shadow-sm border border-zinc-200 hover:border-violet-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className="font-semibold text-[13px] text-zinc-800 line-clamp-1">
                            {lead.name || 'Sem nome'}
                          </span>
                          <span
                            className={cn(
                              'flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0',
                              lead.score_comerc && lead.score_comerc >= 8
                                ? 'bg-emerald-100 text-emerald-700'
                                : lead.score_comerc && lead.score_comerc >= 5
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-zinc-100 text-zinc-600',
                            )}
                          >
                            {lead.score_comerc || 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[11px] text-zinc-400 font-medium truncate">
                            Resp: {(lead as any).expand?.vend_resp?.name || 'Não atribuído'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {colLeads.length === 0 && (
                      <div className="py-6 text-center text-[12px] text-zinc-400 border-2 border-dashed border-zinc-200 rounded-lg mx-1 my-1">
                        Solte cards aqui
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
