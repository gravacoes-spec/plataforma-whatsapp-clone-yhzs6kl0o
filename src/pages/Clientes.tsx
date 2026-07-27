import { useEffect, useState, useMemo } from 'react'
import {
  getBdClientes,
  createBdCliente,
  updateBdCliente,
  deleteBdCliente,
  BdClienteRecord,
} from '@/services/bd-clientes'
import { getLeads, LeadRecord } from '@/services/leads'
import { getUsers } from '@/services/users'
import { getMentors } from '@/services/bd-mentor'
import { getVendasByLeadAndEmail } from '@/services/hotmart'
import {
  getMentoriaPeriodos,
  createMentoriaPeriodo,
  MentoriaPeriodoRecord,
} from '@/services/mentoria_periodos'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  Search,
  Loader2,
  Pencil,
  Trash2,
  GraduationCap,
  DollarSign,
  Calendar as CalendarIcon,
  Bot,
  ShoppingBag,
  Download,
} from 'lucide-react'
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
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function Clientes() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<BdClienteRecord[]>([])
  const [filteredClientes, setFilteredClientes] = useState<BdClienteRecord[]>([])
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [mentors, setMentors] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [filterProduto, setFilterProduto] = useState('all')
  const [filterMentor, setFilterMentor] = useState('all')

  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Partial<BdClienteRecord> | null>(null)
  const [leadVendas, setLeadVendas] = useState<any[]>([])
  const [mentoriaHistory, setMentoriaHistory] = useState<MentoriaPeriodoRecord[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [cliData, leadData, usersData, mentorsData] = await Promise.all([
        getBdClientes(),
        getLeads(),
        getUsers(),
        getMentors(),
      ])
      setClientes(cliData)
      setLeads(leadData)
      setUsers(usersData)

      const activeMentors = mentorsData.filter((m) => m.ativo)

      setMentors(
        usersData.filter((u) => {
          if (u.perfil_acess !== 'Mentor(a)') return false

          return activeMentors.some(
            (m) =>
              (u.email && m.email && u.email.toLowerCase() === m.email.toLowerCase()) ||
              (u.name && m.nome && u.name.toLowerCase() === m.nome.toLowerCase()),
          )
        }),
      )

      setSellers(usersData.filter((u) => u.perfil_acess === 'Vendedor'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('bd_clientes', () => loadData())

  // Extrair produtos únicos para popular o filtro
  const uniqueProducts = useMemo(() => {
    const products = clientes.map((c) => c.Nome_Prod).filter(Boolean) as string[]
    return Array.from(new Set(products))
  }, [clientes])

  useEffect(() => {
    setFilteredClientes(
      clientes.filter((c) => {
        const matchSearch =
          (c.Aluno_a || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.Telefone || '').includes(search)
        const matchProduto = filterProduto === 'all' || c.Nome_Prod === filterProduto
        const matchMentor = filterMentor === 'all' || c.Mentor_a === filterMentor

        return matchSearch && matchProduto && matchMentor
      }),
    )
  }, [search, filterProduto, filterMentor, clientes])

  useEffect(() => {
    if (editingCliente?.Vend_Resp_Lead || editingCliente?.email) {
      getVendasByLeadAndEmail(editingCliente.Vend_Resp_Lead || '', editingCliente.email || '')
        .then(setLeadVendas)
        .catch(() => setLeadVendas([]))
    } else {
      setLeadVendas([])
    }

    if (editingCliente?.id) {
      getMentoriaPeriodos(editingCliente.id)
        .then(setMentoriaHistory)
        .catch(() => setMentoriaHistory([]))
    }
  }, [editingCliente?.id, editingCliente?.Vend_Resp_Lead, editingCliente?.email])

  const saveToHistory = async () => {
    if (!editingCliente?.id) return
    try {
      await createMentoriaPeriodo({
        client_id: editingCliente.id,
        start_date: editingCliente.Data_inicio,
        end_date: editingCliente.Data_term,
        renewal_info: editingCliente.Renov,
        mentor_id: editingCliente.Mentor_a,
      })
      toast.success('Período salvo no histórico', {
        style: { background: '#3dcd1dff', color: 'white', border: 'none' },
      })
      getMentoriaPeriodos(editingCliente.id).then(setMentoriaHistory)
      setEditingCliente({
        ...editingCliente,
        Data_inicio: '',
        Data_term: '',
        Renov: '',
      })
    } catch {
      toast.error('Erro ao salvar histórico', {
        style: { background: '#ef4444', color: 'white', border: 'none' },
      })
    }
  }

  const handleOpenModal = (cliente: Partial<BdClienteRecord>) => {
    setEditingCliente({ ...cliente })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingCliente?.id) return
    try {
      await updateBdCliente(editingCliente.id, editingCliente)
      toast.success('Cliente atualizado com sucesso', {
        style: { background: '#3dcd1dff', color: 'white', border: 'none' },
      })
      setIsModalOpen(false)
    } catch (e) {
      toast.error('Erro ao atualizar cliente'{
        style: { background: '#ef4444', color: 'white', border: 'none' },
      })
    }
  }

  const promptDelete = (id: string) => {
    setClienteToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!clienteToDelete) return
    try {
      await deleteBdCliente(clienteToDelete)
      toast.success('Cliente excluído com sucesso', {
        style: { background: '#3dcd1dff', color: 'white', border: 'none' },
      }
)
    } catch (e) {
      toast.error('Erro ao excluir cliente'{
        style: { background: '#ef4444', color: 'white', border: 'none' },
      })
    } finally {
      setDeleteDialogOpen(false)
      setClienteToDelete(null)
    }
  }

  const exportToCsv = () => {
    const headers = [
      'Aluno',
      'Email',
      'Telefone',
      'Cidade',
      'UF',
      'Produto',
      'Valor Pago',
      'Mentor',
    ]
    const csvContent = [
      headers.join(','),
      ...filteredClientes.map((c) => {
        const mentorName = users.find((u) => u.id === c.Mentor_a)?.name || 'Sem Mentor'
        return [
          `"${(c.Aluno_a || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.Telefone || '').replace(/"/g, '""')}"`,
          `"${(c.Cidade || '').replace(/"/g, '""')}"`,
          `"${(c.UF || '').replace(/"/g, '""')}"`,
          `"${(c.Nome_Prod || '').replace(/"/g, '""')}"`,
          `"${c.Vlr_Pago || 0}"`,
          `"${mentorName.replace(/"/g, '""')}"`,
        ].join(',')
      }),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `clientes_pf_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-[#052136]" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <PageHeader
        title="Clientes"
        description="Gestão de alunos, histórico de compras e mentorias."
      />
      <div className="px-8 pb-8 flex-1 flex flex-col">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row w-full xl:w-auto items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar por aluno, email ou telefone..."
                className="pl-9 bg-white shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterProduto} onValueChange={setFilterProduto}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-sm border-zinc-200">
                <SelectValue placeholder="Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Produtos</SelectItem>
                {uniqueProducts.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterMentor} onValueChange={setFilterMentor}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-sm border-zinc-200">
                <SelectValue placeholder="Mentor(a)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Mentores</SelectItem>
                {mentors.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name || m.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterProduto !== 'all' || filterMentor !== 'all' || search !== '') && (
              <Button
                variant="ghost"
                className="text-zinc-500 hover:text-zinc-900 px-2"
                onClick={() => {
                  setFilterProduto('all')
                  setFilterMentor('all')
                  setSearch('')
                }}
              >
                Limpar
              </Button>
            )}
          </div>

          <Button
            onClick={exportToCsv}
            variant="outline"
            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden shadow-sm flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                <TableHead>Aluno(a)</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Mentor(a)</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-zinc-900">{c.Aluno_a || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-zinc-900 text-[13px]">{c.Telefone || '-'}</span>
                      <span className="text-zinc-500 text-[12px]">{c.email || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[#052136] text-[13px] font-medium">
                        {c.Nome_Prod || '-'}
                      </span>
                      <span className="text-zinc-500 text-[12px]">
                        R$ {c.Vlr_Pago?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      {users.find((u) => u.id === c.Mentor_a)?.name || 'Sem Mentor(a)'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-[#052136]"
                        onClick={() => handleOpenModal(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => promptDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredClientes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Gerenciar Cliente</DialogTitle>
          </DialogHeader>
          {editingCliente && (
            <Tabs defaultValue="basico" className="w-full">
              <div className="px-6 pt-2">
                <TabsList className="w-full grid grid-cols-4 bg-zinc-100">
                  <TabsTrigger
                    value="basico"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#052136] data-[state=active]:font-bold data-[state=active]:shadow-sm text-zinc-500"
                  >
                    Informações
                  </TabsTrigger>
                  <TabsTrigger
                    value="compras"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#052136] data-[state=active]:font-bold data-[state=active]:shadow-sm text-zinc-500"
                  >
                    Compras
                  </TabsTrigger>
                  <TabsTrigger
                    value="form"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#052136] data-[state=active]:font-bold data-[state=active]:shadow-sm text-zinc-500"
                  >
                    Formulário
                  </TabsTrigger>
                  <TabsTrigger
                    value="mentoria"
                    className="data-[state=active]:bg-white data-[state=active]:text-[#052136] data-[state=active]:font-bold data-[state=active]:shadow-sm text-zinc-500"
                  >
                    Mentoria
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 py-4 max-h-[60vh] overflow-y-auto">
                <TabsContent value="basico" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Aluno(a)</Label>
                    <Input
                      value={editingCliente.Aluno_a || ''}
                      onChange={(e) =>
                        setEditingCliente({ ...editingCliente, Aluno_a: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={editingCliente.Telefone || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, Telefone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        value={editingCliente.email || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Cidade</Label>
                      <Input
                        value={editingCliente.Cidade || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, Cidade: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>UF</Label>
                      <Input
                        value={editingCliente.UF || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, UF: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Vendedor Responsável</Label>
                    <Select
                      value={editingCliente.Vend_Resp_User || ''}
                      onValueChange={(v) =>
                        setEditingCliente({ ...editingCliente, Vend_Resp_User: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um vendedor" />
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
                </TabsContent>

                <TabsContent value="compras" className="space-y-4 mt-0">
                  <div className="flex items-center gap-2 text-zinc-900 mb-2">
                    <ShoppingBag className="h-5 w-5 text-[#052136]" />
                    <h3 className="font-semibold">Histórico de Compras (Hotmart)</h3>
                  </div>
                  {leadVendas.length > 0 ? (
                    <div className="rounded-xl border border-zinc-200/60 bg-white overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-zinc-50/50">
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leadVendas.map((v) => (
                            <TableRow key={v.id}>
                              <TableCell className="font-medium text-zinc-800">
                                {v.nome_produto || '-'}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                  {v.status_compra || '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-zinc-500">
                                {v.data_pedido
                                  ? format(parseISO(v.data_pedido), 'dd/MM/yyyy', { locale: ptBR })
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium text-zinc-900">
                                {v.moeda} {v.preco_total?.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
                      <p className="text-sm font-medium text-zinc-600">Nenhuma compra encontrada</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="form" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Área de Graduação</Label>
                    <Input
                      value={editingCliente.area_grad || ''}
                      onChange={(e) =>
                        setEditingCliente({ ...editingCliente, area_grad: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Concurso Alvo</Label>
                    <Input
                      value={editingCliente.concurso_alvo || ''}
                      onChange={(e) =>
                        setEditingCliente({ ...editingCliente, concurso_alvo: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tempo de Estudos</Label>
                      <Input
                        value={editingCliente.tmp_estudos || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, tmp_estudos: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas por Dia</Label>
                      <Input
                        value={editingCliente.hrs_est_dia || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, hrs_est_dia: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Maior Dificuldade</Label>
                    <Input
                      value={editingCliente.maior_dif || ''}
                      onChange={(e) =>
                        setEditingCliente({ ...editingCliente, maior_dif: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivo Principal</Label>
                    <Input
                      value={editingCliente.top_obj || ''}
                      onChange={(e) =>
                        setEditingCliente({ ...editingCliente, top_obj: e.target.value })
                      }
                    />
                  </div>
                </TabsContent>

                <TabsContent value="mentoria" className="space-y-6 mt-0">
                  <div className="space-y-4 border border-zinc-200 bg-zinc-50/50 p-4 rounded-xl">
                    <h3 className="font-semibold text-[#052136] text-sm">Período Ativo</h3>
                    <div className="space-y-2">
                      <Label>Mentor(a) Atribuído(a)</Label>
                      <Select
                        value={editingCliente.Mentor_a || ''}
                        onValueChange={(v) => setEditingCliente({ ...editingCliente, Mentor_a: v })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione um mentor(a)" />
                        </SelectTrigger>
                        <SelectContent>
                          {mentors.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name || m.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          className="bg-white"
                          value={
                            editingCliente.Data_inicio
                              ? editingCliente.Data_inicio.substring(0, 10)
                              : ''
                          }
                          onChange={(e) =>
                            setEditingCliente({
                              ...editingCliente,
                              Data_inicio: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : '',
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          className="bg-white"
                          value={
                            editingCliente.Data_term
                              ? editingCliente.Data_term.substring(0, 10)
                              : ''
                          }
                          onChange={(e) =>
                            setEditingCliente({
                              ...editingCliente,
                              Data_term: e.target.value
                                ? new Date(e.target.value).toISOString()
                                : '',
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Renovação</Label>
                      <Input
                        className="bg-white"
                        value={editingCliente.Renov || ''}
                        onChange={(e) =>
                          setEditingCliente({ ...editingCliente, Renov: e.target.value })
                        }
                        placeholder="Status de renovação (Ex: Renovado, Em negociação...)"
                      />
                    </div>
                    <Button
                      onClick={saveToHistory}
                      variant="outline"
                      className="w-full text-[#052136] hover:text-[#052136] border-[#052136]/20 hover:bg-[#052136]/5"
                    >
                      Arquivar no Histórico
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-zinc-800 text-sm">Histórico de Mentorias</h3>
                    <div className="border border-zinc-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-zinc-50">
                          <TableRow>
                            <TableHead>Mentor</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Fim</TableHead>
                            <TableHead>Renovação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mentoriaHistory.map((h) => (
                            <TableRow key={h.id}>
                              <TableCell>
                                {users.find((u) => u.id === h.mentor_id)?.name || '-'}
                              </TableCell>
                              <TableCell>
                                {h.start_date ? format(parseISO(h.start_date), 'dd/MM/yyyy') : '-'}
                              </TableCell>
                              <TableCell>
                                {h.end_date ? format(parseISO(h.end_date), 'dd/MM/yyyy') : '-'}
                              </TableCell>
                              <TableCell>{h.renewal_info || '-'}</TableCell>
                            </TableRow>
                          ))}
                          {mentoriaHistory.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-zinc-500 py-4">
                                Nenhum histórico
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#052136] hover:bg-[#08304c] text-white">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro e removerá
              os dados de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
              }}
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
