import { useEffect, useState, useMemo } from 'react'
import { getMetas, MetaRecord, createMeta, updateMeta, deleteMeta } from '@/services/metas'
import { getLeads, LeadRecord } from '@/services/leads'
import { getTasks } from '@/services/tasks'
import { getUsers } from '@/services/users'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Pencil, Trash2, Loader2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { Navigate } from 'react-router-dom'

export default function GestaoComercial() {
  const { user } = useAuth()
  const [metas, setMetas] = useState<MetaRecord[]>([])
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Partial<MetaRecord> | null>(null)

  const loadData = async () => {
    try {
      const [mData, lData, tData, uData, vData] = await Promise.all([
        getMetas(),
        getLeads(),
        getTasks(),
        getUsers(),
        pb.collection('vendas_hotmart').getFullList(),
      ])
      setMetas(mData)
      setLeads(lData)
      setTasks(tData)
      setSellers(uData.filter((u) => u.perfil_acess === 'Vendedor'))
      setVendas(vData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('Metas', () => loadData())
  useRealtime('Leads', () => loadData())
  useRealtime('tasks', () => loadData())
  useRealtime('vendas_hotmart', () => loadData())

  const computedMetas = useMemo(() => {
    return metas.map((m) => {
      const pStart = startOfDay(parseISO(m.periodo_in))
      const pEnd = endOfDay(parseISO(m.periodo_fin))

      // 1. Leads Recebidos (Criados no período para o vendedor)
      const mLeads = leads.filter(
        (l) =>
          l.vend_resp === m.vend_resp &&
          isAfter(parseISO(l.created), pStart) &&
          isBefore(parseISO(l.created), pEnd),
      )

      // 2. Abordagens (Leads do período que NÃO estão na etapa 1)
      const mAbordagens = mLeads.filter(
        (l) => l.etapa_pipeline && l.etapa_pipeline !== '1. Novo Lead',
      )

      // 3. Consultorias (Tarefas do tipo Reunião/Consultoria criadas/agendadas no período)
      const mConsultas = tasks.filter((t) => {
        const d = t.due_date ? parseISO(t.due_date) : parseISO(t.created)
        return (
          (t.user_resp === m.vend_resp || t.user_id === m.vend_resp) &&
          t.tp_tarefa === 'Reunião / Consultoria' &&
          isAfter(d, pStart) &&
          isBefore(d, pEnd)
        )
      })

      // 4. Vendas (Vendas do Hotmart no período)
      const mSales = vendas.filter((v) => {
        const lead = leads.find((l) => l.id === v.lead_id)
        if (!lead || lead.vend_resp !== m.vend_resp) return false
        const d = v.data_pedido ? parseISO(v.data_pedido) : parseISO(v.created)
        const status = (v.status_compra || '').toUpperCase()
        return (
          isAfter(d, pStart) &&
          isBefore(d, pEnd) &&
          ['APPROVED', 'COMPLETE', 'COMPLETED', 'APROVADA', 'COMPLETA', 'PAGO', 'PAID'].includes(
            status,
          )
        )
      })

      return {
        ...m,
        calc_leads: mLeads.length,
        calc_abordagens: mAbordagens.length,
        calc_consultorias: mConsultas.length,
        calc_vendas: mSales.length,
        calc_fatur: mSales.reduce((acc, v) => acc + (v.preco_total || 0), 0),
      }
    })
  }, [metas, leads, tasks, vendas])

  const handleOpenModal = (meta: any = null) => {
    setEditingMeta(
      meta || {
        vend_resp: '',
        periodo_in: '',
        periodo_fin: '',
        m_leads_recebidos: 0,
        m_abord_prospec_ativa: 0,
        m_apresent_consult: 0,
        m_vendas: 0,
        m_faturamento: 0,
        ajuste_vendas: 0,
        ajuste_faturamento: 0,
        ajuste_leads: 0,
        ajuste_abordagens: 0,
        ajuste_consultorias: 0,
      },
    )
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingMeta?.vend_resp || !editingMeta.periodo_in || !editingMeta.periodo_fin) {
      toast.error('Preencha os campos obrigatórios')
      return
    }
    try {
      const pIn = new Date(editingMeta.periodo_in).toISOString()
      const pFin = new Date(editingMeta.periodo_fin).toISOString()
      const payload = { ...editingMeta, periodo_in: pIn, periodo_fin: pFin }
      if (editingMeta.id) {
        await updateMeta(editingMeta.id, payload)
        toast.success('Meta atualizada')
      } else {
        await createMeta(payload)
        toast.success('Meta criada')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Erro ao salvar meta')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta meta?')) {
      try {
        await deleteMeta(id)
        toast.success('Meta excluída')
      } catch {
        toast.error('Erro ao excluir')
      }
    }
  }

  if (user?.perfil_acess !== 'Gestor' && user?.perfil_acess !== 'Suporte') {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Gestão Comercial"
        description="Gerencie metas e acompanhe os resultados automáticos dos vendedores."
      />
      <div className="px-8 pb-8 flex-1 flex flex-col">
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => handleOpenModal()}
            className="bg-[#052136] hover:bg-[#08304c] text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Meta
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden shadow-sm flex-1 p-6">
          <h2 className="text-xl font-bold mb-4">Metas Cadastradas</h2>
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                <TableHead>Vendedor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Meta Vendas</TableHead>
                <TableHead>Real. Vendas</TableHead>
                <TableHead>Meta Fatur.</TableHead>
                <TableHead>Real. Fatur.</TableHead>
                <TableHead className="w-[100px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computedMetas.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-zinc-900">
                    {sellers.find((s) => s.id === m.vend_resp)?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {m.periodo_in ? format(parseISO(m.periodo_in), 'dd/MM/yyyy') : ''} -{' '}
                    {m.periodo_fin ? format(parseISO(m.periodo_fin), 'dd/MM/yyyy') : ''}
                  </TableCell>
                  <TableCell>{m.m_vendas || 0}</TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    <div>{m.calc_vendas + (m.ajuste_vendas || 0)}</div>
                    {(m.ajuste_vendas || 0) !== 0 && (
                      <div className="text-[10px] text-zinc-400">
                        Auto: {m.calc_vendas} | Manual: {m.ajuste_vendas || 0}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>R$ {m.m_faturamento?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    <div>R$ {(m.calc_fatur + (m.ajuste_faturamento || 0)).toFixed(2)}</div>
                    {(m.ajuste_faturamento || 0) !== 0 && (
                      <div className="text-[10px] text-zinc-400">
                        Auto: R$ {m.calc_fatur.toFixed(2)} | Manual: R${' '}
                        {(m.ajuste_faturamento || 0).toFixed(2)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500"
                        onClick={() => handleOpenModal(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {computedMetas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-zinc-500">
                    Nenhuma meta cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingMeta?.id ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="space-y-2">
              <Select
                value={editingMeta?.vend_resp || ''}
                onValueChange={(v) => setEditingMeta({ ...editingMeta, vend_resp: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={editingMeta?.periodo_in?.substring(0, 10) || ''}
                  onChange={(e) => setEditingMeta({ ...editingMeta, periodo_in: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={editingMeta?.periodo_fin?.substring(0, 10) || ''}
                  onChange={(e) => setEditingMeta({ ...editingMeta, periodo_fin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-[#052136] font-bold">🎯 Meta: Leads Recebidos</Label>
                <Input
                  type="number"
                  value={editingMeta?.m_leads_recebidos || 0}
                  onChange={(e) =>
                    setEditingMeta({ ...editingMeta, m_leads_recebidos: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#052136] font-bold">🎯 Meta: Abordagens</Label>
                <Input
                  type="number"
                  value={editingMeta?.m_abord_prospec_ativa || 0}
                  onChange={(e) =>
                    setEditingMeta({
                      ...editingMeta,
                      m_abord_prospec_ativa: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#052136] font-bold">🎯 Meta: Consultorias</Label>
                <Input
                  type="number"
                  value={editingMeta?.m_apresent_consult || 0}
                  onChange={(e) =>
                    setEditingMeta({ ...editingMeta, m_apresent_consult: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#052136] font-bold">🎯 Meta: Vendas</Label>
                <Input
                  type="number"
                  value={editingMeta?.m_vendas || 0}
                  onChange={(e) =>
                    setEditingMeta({ ...editingMeta, m_vendas: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#052136] font-bold">🎯 Meta: Faturamento</Label>
                <Input
                  type="number"
                  value={editingMeta?.m_faturamento || 0}
                  onChange={(e) =>
                    setEditingMeta({ ...editingMeta, m_faturamento: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="border-t border-emerald-100 bg-emerald-50/50 rounded-lg p-4 my-2 grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <h3 className="text-sm font-bold text-emerald-800 mb-1">
                  Resultados Alcançados (Automático)
                </h3>
                <p className="text-[11px] text-emerald-600 mb-2">
                  Calculado em tempo real com base nos movimentos do funil e tarefas.
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-500 text-xs uppercase font-bold">Leads Recebidos</Label>
                <div className="text-lg font-semibold text-zinc-900">
                  {computedMetas.find((m) => m.id === editingMeta?.id)?.calc_leads || 0}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-500 text-xs uppercase font-bold">Abordagens</Label>
                <div className="text-lg font-semibold text-zinc-900">
                  {computedMetas.find((m) => m.id === editingMeta?.id)?.calc_abordagens || 0}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-500 text-xs uppercase font-bold">Consultorias</Label>
                <div className="text-lg font-semibold text-zinc-900">
                  {computedMetas.find((m) => m.id === editingMeta?.id)?.calc_consultorias || 0}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-500 text-xs uppercase font-bold">Vendas</Label>
                <div className="text-lg font-semibold text-zinc-900">
                  {computedMetas.find((m) => m.id === editingMeta?.id)?.calc_vendas || 0}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-500 text-xs uppercase font-bold">Faturamento</Label>
                <div className="text-lg font-semibold text-zinc-900">
                  R${' '}
                  {computedMetas.find((m) => m.id === editingMeta?.id)?.calc_fatur?.toFixed(2) ||
                    '0.00'}
                </div>
              </div>
            </div>
          </div>

          {user?.perfil_acess === 'Gestor' && (
            <div className="border-t border-zinc-200 my-2 pt-4 px-1">
              <h3 className="text-sm font-bold text-zinc-700 mb-1">Ajustes Manuais (Opcional)</h3>
              <p className="text-[11px] text-zinc-400 mb-3">
                Valores manuais somados aos realizados automáticos.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-700">Ajuste: Leads</Label>
                  <Input
                    type="number"
                    value={editingMeta?.ajuste_leads || 0}
                    onChange={(e) =>
                      setEditingMeta({ ...editingMeta, ajuste_leads: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700">Ajuste: Abordagens</Label>
                  <Input
                    type="number"
                    value={editingMeta?.ajuste_abordagens || 0}
                    onChange={(e) =>
                      setEditingMeta({ ...editingMeta, ajuste_abordagens: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700">Ajuste: Consultorias</Label>
                  <Input
                    type="number"
                    value={editingMeta?.ajuste_consultorias || 0}
                    onChange={(e) =>
                      setEditingMeta({
                        ...editingMeta,
                        ajuste_consultorias: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700">Ajuste: Vendas</Label>
                  <Input
                    type="number"
                    value={editingMeta?.ajuste_vendas || 0}
                    onChange={(e) =>
                      setEditingMeta({ ...editingMeta, ajuste_vendas: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-700">Ajuste: Faturamento</Label>
                  <Input
                    type="number"
                    value={editingMeta?.ajuste_faturamento || 0}
                    onChange={(e) =>
                      setEditingMeta({
                        ...editingMeta,
                        ajuste_faturamento: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#052136] hover:bg-[#08304c] text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
