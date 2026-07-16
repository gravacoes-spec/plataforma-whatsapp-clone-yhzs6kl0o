import { useEffect, useState } from 'react'
import {
  getBdClientes,
  createBdCliente,
  updateBdCliente,
  deleteBdCliente,
  BdClienteRecord,
} from '@/services/bd-clientes'
import { getLeads, LeadRecord } from '@/services/leads'
import { getUsers } from '@/services/users'
import { getVendasByLead } from '@/services/hotmart'
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

export default function Clientes() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<BdClienteRecord[]>([])
  const [filteredClientes, setFilteredClientes] = useState<BdClienteRecord[]>([])
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [mentors, setMentors] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Partial<BdClienteRecord> | null>(null)
  const [leadVendas, setLeadVendas] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [cliData, leadData, usersData] = await Promise.all([
        getBdClientes(),
        getLeads(),
        getUsers(),
      ])
      setClientes(cliData)
      setLeads(leadData)
      setUsers(usersData)
      setMentors(usersData.filter((u) => u.perfil_acess === 'Mentor(a)'))
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

  useEffect(() => {
    setFilteredClientes(
      clientes.filter(
        (c) =>
          (c.Aluno_a || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.Telefone || '').includes(search),
      ),
    )
  }, [search, clientes])

  useEffect(() => {
    if (editingCliente?.Vend_Resp_Lead) {
      getVendasByLead(editingCliente.Vend_Resp_Lead)
        .then(setLeadVendas)
        .catch(() => setLeadVendas([]))
    } else {
      setLeadVendas([])
    }
  }, [editingCliente?.Vend_Resp_Lead])

  const handleOpenModal = (cliente: Partial<BdClienteRecord>) => {
    setEditingCliente({ ...cliente })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingCliente?.id) return
    try {
      await updateBdCliente(editingCliente.id, editingCliente)
      toast.success('Cliente atualizado com sucesso')
      setIsModalOpen(false)
    } catch (e) {
      toast.error('Erro ao atualizar cliente')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteBdCliente(id)
        toast.success('Cliente excluído com sucesso')
      } catch (e) {
        toast.error('Erro ao excluir cliente')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
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
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Buscar por aluno, email ou telefone..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
                      <span className="text-violet-700 text-[13px] font-medium">
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
                        className="h-8 w-8 text-zinc-500 hover:text-violet-600"
                        onClick={() => handleOpenModal(c)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(c.id)}
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
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="basico">Informações</TabsTrigger>
                  <TabsTrigger value="compras">Compras</TabsTrigger>
                  <TabsTrigger value="form">Formulário</TabsTrigger>
                  <TabsTrigger value="mentoria">Mentoria</TabsTrigger>
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
                    <ShoppingBag className="h-5 w-5 text-violet-600" />
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

                <TabsContent value="mentoria" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Mentor(a) Atribuído(a)</Label>
                    <Select
                      value={editingCliente.Mentor_a || ''}
                      onValueChange={(v) => setEditingCliente({ ...editingCliente, Mentor_a: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um mentor(a)" />
                      </SelectTrigger>
                      <SelectContent>
                        {mentors.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
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
                        value={
                          editingCliente.Data_term ? editingCliente.Data_term.substring(0, 10) : ''
                        }
                        onChange={(e) =>
                          setEditingCliente({
                            ...editingCliente,
                            Data_term: e.target.value ? new Date(e.target.value).toISOString() : '',
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Renovação</Label>
                    <Input
                      value={editingCliente.Renov || ''}
                      onChange={(e) =>
                        setEditingCliente({ ...editingCliente, Renov: e.target.value })
                      }
                      placeholder="Status de renovação (Ex: Renovado, Em negociação...)"
                    />
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
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
