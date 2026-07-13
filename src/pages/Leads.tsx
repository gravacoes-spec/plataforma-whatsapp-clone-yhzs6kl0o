import { useEffect, useState } from 'react'
import { getLeads, updateLead, createLead, deleteLead, LeadRecord } from '@/services/leads'
import { getUsers } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Search, Loader2, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const PIPELINE_STAGES = [
  'Triagem / Qualificação',
  '3. Lead Premium',
  '4. Lead Qualificado',
  '5. Lead em Nutrição',
  'Novo',
  'Contatado',
  'Apresentacao',
  'Negociacao',
  'Ganho',
  'Perdido',
]

export default function Leads() {
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [filteredLeads, setFilteredLeads] = useState<LeadRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Partial<LeadRecord> | null>(null)

  const loadData = async () => {
    try {
      const [data, usersData] = await Promise.all([getLeads(), getUsers()])
      setLeads(data)
      setUsers(
        usersData.filter((u) => u.perfil_acess === 'Vendedor' || u.perfil_acess === 'Gestor'),
      )
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

  useEffect(() => {
    setFilteredLeads(
      leads.filter(
        (l) =>
          (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
          (l.phone || '').includes(search),
      ),
    )
  }, [search, leads])

  const handleOpenModal = (lead: Partial<LeadRecord> | null = null) => {
    setEditingLead(
      lead || {
        name: '',
        email: '',
        phone: '',
        vend_resp: '',
        etapa_pipeline: 'Novo',
        int_perito: 'Ainda avaliando',
        area_grad: '',
        tmp_acad: 'Formado ou últimos 3 anos',
        renda: 'Possui renda própria',
        score_comerc: 0,
        motivo_perda: '',
        concurso_alvo: '',
        tmp_estudos: 'Iniciante',
        hrs_est_dia: '1-2h',
        maior_dif: 'Tempo',
        top_obj: 'Aprovacao',
        inv_prep: 'Medio',
      },
    )
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingLead) return
    try {
      if (editingLead.id) {
        await updateLead(editingLead.id, editingLead)
        toast.success('Lead atualizado')
      } else {
        await createLead(editingLead)
        toast.success('Lead criado')
      }
      setIsModalOpen(false)
    } catch (e) {
      toast.error('Erro ao salvar')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este lead?')) {
      try {
        await deleteLead(id)
        toast.success('Lead excluído')
      } catch (e) {
        toast.error('Erro ao excluir')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <PageHeader title="Leads" description="Gerencie seus contatos e clientes em potencial." />
      <div className="px-8 pb-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white">
              <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
            </Button>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Lead
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden shadow-sm flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Etapa Pipeline</TableHead>
                <TableHead>Vendedor Responsável</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-zinc-900">{l.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-zinc-900 text-[13px]">{l.phone || '-'}</span>
                      <span className="text-zinc-500 text-[12px]">{l.email || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-600/20">
                      {l.etapa_pipeline || 'Novo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {(l as any).expand?.vend_resp?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
                      {l.score_comerc || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-violet-600"
                        onClick={() => handleOpenModal(l)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(l.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>{editingLead?.id ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <Tabs defaultValue="basico" className="w-full">
              <div className="px-6 pt-2">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="basico">Básico</TabsTrigger>
                  <TabsTrigger value="comercial">Comercial</TabsTrigger>
                  <TabsTrigger value="academico">Acadêmico</TabsTrigger>
                  <TabsTrigger value="estudos">Estudos</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 py-4 max-h-[60vh] overflow-y-auto">
                <TabsContent value="basico" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={editingLead.name || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={editingLead.phone || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input
                      value={editingLead.email || ''}
                      onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendedor Responsável</Label>
                    <Select
                      value={editingLead.vend_resp || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, vend_resp: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="comercial" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Etapa Pipeline</Label>
                    <Select
                      value={editingLead.etapa_pipeline || 'Novo'}
                      onValueChange={(v) => setEditingLead({ ...editingLead, etapa_pipeline: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Score Comercial</Label>
                    <Input
                      type="number"
                      value={editingLead.score_comerc || 0}
                      onChange={(e) =>
                        setEditingLead({ ...editingLead, score_comerc: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interesse do Lead</Label>
                    <Select
                      value={editingLead.int_perito || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, int_perito: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100% decidido">100% decidido</SelectItem>
                        <SelectItem value="Ainda avaliando">Ainda avaliando</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Motivo Perda</Label>
                    <Select
                      value={editingLead.motivo_perda || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, motivo_perda: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Preco">Preço</SelectItem>
                        <SelectItem value="Concorrencia">Concorrência</SelectItem>
                        <SelectItem value="Desistiu">Desistiu</SelectItem>
                        <SelectItem value="Sem Fit">Sem Fit</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="academico" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Área de Graduação</Label>
                    <Input
                      value={editingLead.area_grad || ''}
                      onChange={(e) =>
                        setEditingLead({ ...editingLead, area_grad: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Concurso Alvo</Label>
                    <Input
                      value={editingLead.concurso_alvo || ''}
                      onChange={(e) =>
                        setEditingLead({ ...editingLead, concurso_alvo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Momento Acadêmico</Label>
                    <Select
                      value={editingLead.tmp_acad || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, tmp_acad: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Formado ou últimos 3 anos">
                          Formado ou últimos 3 anos
                        </SelectItem>
                        <SelectItem value="Primeiros anos da graduação">
                          Primeiros anos da graduação
                        </SelectItem>
                        <SelectItem value="Sem graduação aderente">
                          Sem graduação aderente
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="estudos" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Tempo de Estudos</Label>
                    <Select
                      value={editingLead.tmp_estudos || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, tmp_estudos: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Iniciante">Iniciante</SelectItem>
                        <SelectItem value="Intermediario">Intermediário</SelectItem>
                        <SelectItem value="Avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Horas por Dia</Label>
                    <Select
                      value={editingLead.hrs_est_dia || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, hrs_est_dia: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2h">1-2h</SelectItem>
                        <SelectItem value="3-4h">3-4h</SelectItem>
                        <SelectItem value="5-6h">5-6h</SelectItem>
                        <SelectItem value="7h+">7h+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Maior Dificuldade</Label>
                    <Select
                      value={editingLead.maior_dif || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, maior_dif: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tempo">Tempo</SelectItem>
                        <SelectItem value="Disciplina">Disciplina</SelectItem>
                        <SelectItem value="Metodo">Método</SelectItem>
                        <SelectItem value="Recursos">Recursos</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Investimento em Preparação</Label>
                    <Select
                      value={editingLead.inv_prep || ''}
                      onValueChange={(v) => setEditingLead({ ...editingLead, inv_prep: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixo">Baixo</SelectItem>
                        <SelectItem value="Medio">Médio</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
          <DialogFooter className="p-6 pt-4 border-t bg-zinc-50/50">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
