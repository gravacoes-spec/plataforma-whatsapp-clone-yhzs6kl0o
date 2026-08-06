import { useEffect, useRef, useState } from 'react'
import { getLeads, updateLead, LeadRecord } from '@/services/leads'
import { useRealtime } from '@/hooks/use-realtime'
import { Loader2, Phone, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { PageHeader } from '@/components/ui/page-header'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const COLUMNS = [
  { id: '1. Novo Lead', title: 'Novo Lead' },
  { id: '2. Abordagem', title: 'Abordagem' },
  { id: '3. Lead Premium', title: 'Lead Premium' },
  { id: '4. Lead Qualificado', title: 'Lead Qualificado' },
  { id: '5. Lead em Nutrição', title: 'Lead em Nutrição' },
  { id: '6. Agendamento de Consultoria', title: 'Agendamento de Consultoria' },
  { id: '7. Negociação', title: 'Negociação' },
  { id: '8. Venda Realizada', title: 'Venda Realizada' },
  { id: '9. Follow-up', title: 'Follow-up' },
  { id: '10. Lead Desqualificado/Perda', title: 'Lead Desqualificado/Perda' },
]

const LOSS_REASONS = [
  'Orçamento insuficiente',
  'O produto não se encaixa à necessidade',
  'Não satisfeito com as condições de pagamento',
  'Comprado do concorrente',
  'Lead desqualificado (não quer se dedicar/não tem graduação específica)',
  'Lead não retornou o(s) contato(s)',
]

export default function CrmPipeline() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null)
  const [lossModalOpen, setLossModalOpen] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<{ leadId: string; columnId: string } | null>(null)
  const [lossReason, setLossReason] = useState('')
  const navigate = useNavigate()

  // Referências do scroll horizontal do Pipeline.
  const pipelineScrollRef = useRef<HTMLDivElement | null>(null)
  const pipelineContentRef = useRef<HTMLDivElement | null>(null)
  const topScrollRef = useRef<HTMLDivElement | null>(null)
  const topScrollContentRef = useRef<HTMLDivElement | null>(null)

  // Controle do "grab to scroll".
  const panRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  })
  const [isPanning, setIsPanning] = useState(false)

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

  /*
   * A scrollbar superior e o Pipeline usam o MESMO scrollLeft.
   * A barra superior é apenas uma "ponte" visual para o mesmo eixo X.
   *
   * Importante: não usamos uma largura artificial calculada por estado.
   * O elemento interno da scrollbar mede diretamente o conteúdo real
   * do Pipeline através do scrollWidth.
   */
  useEffect(() => {
    const pipeline = pipelineScrollRef.current
    const topScroll = topScrollRef.current
    const topContent = topScrollContentRef.current
    const pipelineContent = pipelineContentRef.current

    if (!pipeline || !topScroll || !topContent || !pipelineContent) return

    const syncTopWidth = () => {
      // A largura precisa representar o scrollWidth real do Pipeline.
      topContent.style.width = `${pipeline.scrollWidth}px`
    }

    const syncTopFromPipeline = () => {
      if (topScroll.scrollLeft !== pipeline.scrollLeft) {
        topScroll.scrollLeft = pipeline.scrollLeft
      }
    }

    const syncPipelineFromTop = () => {
      if (pipeline.scrollLeft !== topScroll.scrollLeft) {
        pipeline.scrollLeft = topScroll.scrollLeft
      }
    }

    syncTopWidth()
    syncTopFromPipeline()

    const resizeObserver = new ResizeObserver(syncTopWidth)
    resizeObserver.observe(pipeline)
    resizeObserver.observe(pipelineContent)

    pipeline.addEventListener('scroll', syncTopFromPipeline, { passive: true })
    topScroll.addEventListener('scroll', syncPipelineFromTop, { passive: true })

    window.addEventListener('resize', syncTopWidth)

    return () => {
      resizeObserver.disconnect()
      pipeline.removeEventListener('scroll', syncTopFromPipeline)
      topScroll.removeEventListener('scroll', syncPipelineFromTop)
      window.removeEventListener('resize', syncTopWidth)
    }
  }, [leads])

  // Shift + roda do mouse = navegação horizontal.
  useEffect(() => {
    const pipeline = pipelineScrollRef.current
    if (!pipeline) return

    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      if (pipeline.scrollWidth <= pipeline.clientWidth) return

      event.preventDefault()
      pipeline.scrollLeft += event.deltaY
    }

    pipeline.addEventListener('wheel', handleWheel, { passive: false })

    return () => pipeline.removeEventListener('wheel', handleWheel)
  }, [])

  // Finaliza o grab-scroll mesmo se o mouse sair da área do Pipeline.
  useEffect(() => {
    const stopPanning = () => {
      if (!panRef.current.active) return
      panRef.current.active = false
      setIsPanning(false)
    }

    window.addEventListener('mouseup', stopPanning)
    window.addEventListener('blur', stopPanning)

    return () => {
      window.removeEventListener('mouseup', stopPanning)
      window.removeEventListener('blur', stopPanning)
    }
  }, [])

  const startPipelinePan = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    // Não captura o mouse quando o usuário estiver interagindo com cards
    // ou elementos clicáveis.
    if (
      target.closest('[data-lead-card="true"]') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('textarea')
    ) {
      return
    }

    const pipeline = pipelineScrollRef.current
    if (!pipeline) return

    panRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: pipeline.scrollLeft,
    }

    setIsPanning(true)
  }

  const movePipelinePan = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return

    const pipeline = pipelineScrollRef.current
    if (!pipeline) return

    const deltaX = event.clientX - panRef.current.startX
    pipeline.scrollLeft = panRef.current.startScrollLeft - deltaX
  }

  const stopPipelinePan = () => {
    if (!panRef.current.active) return
    panRef.current.active = false
    setIsPanning(false)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50/50">
        <Loader2 className="h-6 w-6 animate-spin text-[#052136]" />
      </div>
    )
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const applyStageChange = async (leadId: string, columnId: string, motivo_perda?: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, etapa_pipeline: columnId, motivo_perda: motivo_perda || l.motivo_perda }
          : l,
      ),
    )
    try {
      await updateLead(leadId, { etapa_pipeline: columnId, motivo_perda })
    } catch (err) {
      console.error(err)
      loadData()
    }
  }

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    if (!leadId) return

    if (columnId === '10. Lead Desqualificado/Perda') {
      setPendingDrop({ leadId, columnId })
      setLossModalOpen(true)
      return
    }

    applyStageChange(leadId, columnId)
  }

  const confirmLoss = () => {
    if (!lossReason) return
    if (pendingDrop) {
      applyStageChange(pendingDrop.leadId, pendingDrop.columnId, lossReason)
      setPendingDrop(null)
      setLossModalOpen(false)
      setLossReason('')
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 overflow-hidden">
      {/* Header fixo dentro da área do CRM. */}
      <div className="shrink-0 z-30 bg-zinc-50/95 backdrop-blur-sm">
        <PageHeader
          title="Pipeline CRM"
          description="Acompanhe a jornada dos seus leads pelo funil de vendas em 10 etapas."
        />

        {/*
          CONTROLE HORIZONTAL PRINCIPAL
          --------------------------------
          Este é um elemento de scroll real. Seu conteúdo interno recebe
          exatamente o mesmo scrollWidth do Pipeline abaixo.
        */}
        <div
          ref={topScrollRef}
          aria-label="Navegação horizontal do Pipeline"
          className="mx-8 mb-2 h-3 overflow-x-scroll overflow-y-hidden rounded-full bg-zinc-100 border border-zinc-200/70 [&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar-thumb]:bg-zinc-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-100"
        >
          <div
            ref={topScrollContentRef}
            aria-hidden="true"
            style={{ width: '100%', height: '1px' }}
          />
        </div>
      </div>

      {/*
        O Pipeline continua sendo o verdadeiro container horizontal.
        Mantemos sua scrollbar nativa como fallback, mas ela fica
        discreta para evitar duas barras visualmente concorrentes.
      */}
      <div
        ref={pipelineScrollRef}
        onMouseDown={startPipelinePan}
        onMouseMove={movePipelinePan}
        onMouseUp={stopPipelinePan}
        onMouseLeave={stopPipelinePan}
        className={cn(
          'flex-1 min-h-0 min-w-0 px-8 pb-8 overflow-x-auto overflow-y-hidden',
          '[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full',
          '[&::-webkit-scrollbar-track]:bg-transparent',
          isPanning ? 'cursor-grabbing select-none' : 'cursor-grab',
        )}
      >
        <div ref={pipelineContentRef} className="flex h-full gap-4 items-start pt-2 w-max pb-1">
          {COLUMNS.map((col) => {
            const colLeads = leads.filter((l) => (l.etapa_pipeline || '1. Novo Lead') === col.id)

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

                {/* SUBSTITUIÇÃO AQUI: Scroll nativo garantindo o min-h-0 */}
                <div className="flex-1 overflow-y-auto min-h-0 px-2.5 pb-4 pt-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
                  <div className="flex flex-col gap-2.5">
                    {colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        data-lead-card="true"
                        className="group flex flex-col p-3.5 bg-white rounded-lg shadow-sm border border-zinc-200 hover:border-[#052136] hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-[13px] text-zinc-800 line-clamp-1">
                              {lead.name || 'Sem nome'}
                            </span>
                          </div>
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
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto bg-white p-0">
          {selectedLead && (
            <div className="flex flex-col h-full">
              <SheetHeader className="p-6 border-b border-zinc-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#052136] text-white font-bold text-lg">
                    {selectedLead.name?.charAt(0)?.toUpperCase() || 'L'}
                  </div>
                  <SheetTitle className="text-xl leading-tight text-[#052136]">
                    {selectedLead.name}
                  </SheetTitle>
                </div>
                <div className="flex flex-col gap-1.5 mt-4 text-sm text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" /> {selectedLead.phone || '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" /> {selectedLead.email || '-'}
                  </div>
                </div>
              </SheetHeader>
              <div className="p-6 flex-1 space-y-7">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    Comercial
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Etapa do Pipeline:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.etapa_pipeline || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Interesse em atuar como perito:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.int_perito || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Score Comercial:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.score_comerc || 0}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Capacidade financeira:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.renda || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    Acadêmico
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Área de Graduação:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.area_grad || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Período acadêmico:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.tmp_acad || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Concurso Alvo:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.concurso_alvo || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Investimento em Prep.:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.inv_prep || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    Estudos
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Tempo de Estudos:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.tmp_estudos || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-zinc-500">Horas de Estudo/Dia:</span>
                      <span className="font-medium text-zinc-900 text-right">
                        {selectedLead.hrs_est_dia || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px] gap-4">
                      <span className="text-zinc-500 shrink-0">Maior Dificuldade:</span>
                      <span className="font-medium text-zinc-900 text-right max-w-[220px]">
                        {selectedLead.maior_dif || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[13px] gap-4">
                      <span className="text-zinc-500 shrink-0">Objetivo Principal:</span>
                      <span className="font-medium text-zinc-900 text-right max-w-[220px]">
                        {selectedLead.top_obj || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    Disponibilidade
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex flex-col text-[13px] gap-2">
                      <span className="text-zinc-500">Dias preferenciais para Mentoria:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedLead.dias_ment &&
                        Array.isArray(selectedLead.dias_ment) &&
                        selectedLead.dias_ment.length > 0 ? (
                          selectedLead.dias_ment.map((dia) => (
                            <span
                              key={dia}
                              className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md"
                            >
                              {dia}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] font-medium text-zinc-400 italic">
                            Não informado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLead.motivo_perda && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold tracking-wider text-red-500 uppercase">
                      Motivo da Perda
                    </h4>
                    <div className="text-[13px] font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                      {selectedLead.motivo_perda}
                    </div>
                  </div>
                )}

                {selectedLead.historico_notas && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.historico_notas.split(',').map((tag) => (
                        <span
                          key={tag}
                          className="text-[12px] font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-md"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 p-4 border-t border-zinc-100 bg-zinc-50 mt-auto">
                <Button
                  variant="outline"
                  onClick={() => navigate('/crm/leads?lead=' + selectedLead.id)}
                  className="flex-1 text-xs text-zinc-700 border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Editar Lead
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/crm/tasks?lead=' + selectedLead.id)}
                  className="flex-1 text-xs text-zinc-700 border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
                >
                  Adicionar Tarefa
                </Button>
                <Button
                  onClick={() => navigate('/inbox?phone=' + selectedLead.phone)}
                  className="flex-1 text-xs bg-[#052136] hover:bg-[#08304c] text-white"
                >
                  Chat WhatsApp
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={lossModalOpen} onOpenChange={setLossModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo da Perda</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Label>Selecione o motivo para desqualificar este lead</Label>
            <Select value={lossReason} onValueChange={setLossReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
              onClick={() => setLossModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={!lossReason}
              onClick={confirmLoss}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Perda
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
