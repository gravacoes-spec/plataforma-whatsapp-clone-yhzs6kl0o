import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTasks, updateTask, createTask, deleteTask } from '@/services/tasks'
import { getLeads, LeadRecord } from '@/services/leads'
import { getBdClientes, BdClienteRecord } from '@/services/bd-clientes'
import { getUsers } from '@/services/users'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import {
  format,
  isPast,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  parseISO,
  addMonths,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Loader2,
  Plus,
  Calendar as CalendarIcon,
  List,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Star,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TASK_TYPES = [
  'Ligação',
  'WhatsApp',
  'E-mail',
  'Reunião / Consultoria',
  'Follow-up',
  'Administrativo',
  'Outro',
]

export default function Tasks() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState<any[]>([])
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [clientes, setClientes] = useState<BdClienteRecord[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<'all' | 'late' | 'premium'>('all')
  const [filterType, setFilterType] = useState('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    id: '',
    description: '',
    due_date: '',
    lead_id: '',
    client_id: '',
    tp_tarefa: '',
    user_resp: '',
  })

  const loadData = async () => {
    try {
      const [taskData, leadData, clientData, usersData] = await Promise.all([
        getTasks(),
        getLeads(),
        getBdClientes(),
        getUsers(),
      ])
      setTasks(taskData)
      setLeads(leadData)
      setClientes(clientData)
      setUsers(usersData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const leadParam = searchParams.get('lead')
    const clientParam = searchParams.get('client')
    if (leadParam || clientParam) {
      setNewTask((prev) => ({
        ...prev,
        lead_id: leadParam || '',
        client_id: clientParam || '',
        user_resp: user?.id || '',
      }))
      setIsCreateOpen(true)
    }
  }, [])

  useRealtime('tasks', () => loadData())
  useRealtime('Leads', () => loadData())
  useRealtime('bd_clientes', () => loadData())

  const toggleTask = async (task: any) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)),
      )
      await updateTask(task.id, { completed: !task.completed })
    } catch {
      loadData()
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      await deleteTask(taskId)
      toast.success('Tarefa excluída')
    } catch {
      loadData()
      toast.error('Erro ao excluir')
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.description.trim()) {
      toast.error('Descrição é obrigatória')
      return
    }
    try {
      const payload: any = {
        description: newTask.description,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : '',
        user_resp: newTask.user_resp || user?.id,
        tp_tarefa: newTask.tp_tarefa,
      }
      if (newTask.lead_id) payload.lead_id = newTask.lead_id
      if (newTask.client_id) payload.client_id = newTask.client_id

      if (newTask.id) {
        await updateTask(newTask.id, payload)
        toast.success('Tarefa atualizada')
      } else {
        payload.completed = false
        payload.user_id = user?.id
        await createTask(payload)
        toast.success('Tarefa criada')
      }
      setIsCreateOpen(false)
      setNewTask({
        id: '',
        description: '',
        due_date: '',
        lead_id: '',
        client_id: '',
        tp_tarefa: '',
        user_resp: '',
      })
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('lead')
      newParams.delete('client')
      setSearchParams(newParams)
      loadData()
    } catch {
      toast.error('Erro ao salvar tarefa')
    }
  }

  const handleEditTask = (task: any) => {
    setNewTask({
      id: task.id,
      description: task.description || '',
      due_date: task.due_date ? task.due_date.substring(0, 10) : '',
      lead_id: task.lead_id || '',
      client_id: task.client_id || '',
      tp_tarefa: task.tp_tarefa || '',
      user_resp: task.user_resp || task.user_id || '',
    })
    setIsCreateOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    )
  }

  const filteredTasks = tasks.filter((t) => {
    // Garante que só veja as tarefas onde ele é o responsável (ou o criador)
    const responsavelId = t.user_resp || t.user_id
    if (responsavelId !== user?.id) return false

    // Aplica o filtro de Tipo de Tarefa
    if (filterType !== 'all' && t.tp_tarefa !== filterType) return false

    if (filter === 'late' && (t.completed || !t.due_date || !isPast(parseISO(t.due_date))))
      return false

    if (filter === 'premium') {
      const leadId = t.lead_id
      if (!leadId) return false
      const lead = leads.find((l) => l.id === leadId)
      if (!lead) return false
      if (
        lead.etapa_pipeline !== '3. Lead Premium' &&
        lead.etapa_pipeline !== '4. Lead Qualificado'
      )
        return false
    }

    return true
  })

  const lateCount = tasks.filter(
    (t) =>
      !t.completed && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date)),
  ).length

  const renderList = () => (
    <div className="space-y-3">
      {filteredTasks.map((t) => {
        const isTaskLate =
          !t.completed &&
          t.due_date &&
          isPast(parseISO(t.due_date)) &&
          !isToday(parseISO(t.due_date))
        return (
          <div
            key={t.id}
            className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm transition-all hover:shadow-md"
          >
            <button
              onClick={() => toggleTask(t)}
              className="shrink-0 text-zinc-400 hover:text-emerald-500 transition-colors"
            >
              {t.completed ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <Circle className="h-6 w-6" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-[15px] font-medium text-zinc-900 truncate',
                  t.completed && 'line-through text-zinc-400',
                )}
              >
                {t.description || 'Sem descrição'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {t.due_date && (
                  <span
                    className={cn(
                      'text-[12px] font-medium flex items-center gap-1',
                      isTaskLate ? 'text-red-500' : 'text-zinc-500',
                    )}
                  >
                    {isTaskLate && <AlertTriangle className="h-3 w-3" />}
                    {format(parseISO(t.due_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                )}

                {t.tp_tarefa && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                    {t.tp_tarefa}
                  </span>
                )}

                {(() => {
                  const respUser = users.find((u) => u.id === (t.user_resp || t.user_id))
                  if (!respUser) return null
                  return (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-medium truncate max-w-[150px]">
                      👤 {respUser.name || respUser.email}
                    </span>
                  )
                })()}

                {t.expand?.lead_id && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200/60 font-medium truncate max-w-[200px]">
                    Lead: {t.expand.lead_id.name}
                  </span>
                )}
                {t.expand?.client_id && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-medium truncate max-w-[200px]">
                    Cliente: {t.expand.client_id.Aluno_a}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditTask(t)
                }}
                className="p-1.5 text-zinc-300 hover:text-violet-500 hover:bg-violet-50 rounded-md transition-colors"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTask(t.id)
                }}
                className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-zinc-500 bg-white rounded-xl border border-zinc-200/60 border-dashed">
          Nenhuma tarefa encontrada.
        </div>
      )}
    </div>
  )

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <div className="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col h-full min-h-[550px]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="text-lg font-bold text-zinc-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {days.map((day) => {
            const dayTasks = filteredTasks.filter(
              (t) => t.due_date && isSameDay(parseISO(t.due_date), day),
            )
            return (
              <div
                key={day.toString()}
                className={cn(
                  'border-r border-b border-zinc-100 p-2 flex flex-col gap-1 overflow-y-auto min-h-[80px]',
                  !isSameMonth(day, monthStart) && 'bg-zinc-50/30 opacity-50',
                )}
              >
                <div
                  className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-end',
                    isToday(day) ? 'bg-[#052136] text-white' : 'text-zinc-600',
                  )}
                >
                  {format(day, 'd')}
                </div>
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      'group/cal-task relative text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer transition-colors',
                      t.completed
                        ? 'bg-zinc-50 text-zinc-400 border-zinc-200 line-through'
                        : isPast(day) && !isToday(day)
                          ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                          : 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100',
                    )}
                    onClick={() => toggleTask(t)}
                  >
                    {t.description}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover/cal-task:flex items-center gap-0.5 bg-white/90 rounded backdrop-blur-sm px-0.5 shadow-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTask(t)
                        }}
                        className="p-0.5 text-zinc-500 hover:text-[#052136] rounded-sm"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTask(t.id)
                        }}
                        className="p-0.5 text-zinc-500 hover:text-red-600 rounded-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50">
      <div className="px-8 pt-8 pb-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Minhas Tarefas</h1>
          <p className="text-sm text-zinc-500 mt-1">Acompanhe suas pendências e compromissos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] bg-white border-zinc-200 text-zinc-700 shadow-sm">
              <SelectValue placeholder="Tipo de Tarefa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {TASK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={filter === 'late' ? 'default' : 'outline'}
            onClick={() => setFilter(filter === 'late' ? 'all' : 'late')}
            className={cn(
              filter === 'late' && 'bg-red-500 hover:bg-red-600 text-white border-red-500',
              filter !== 'late' && 'bg-white text-zinc-700 border-zinc-200',
              'shadow-sm',
            )}
          >
            <AlertTriangle className="h-4 w-4 mr-2" /> Atrasadas ({lateCount})
          </Button>

          {/* Oculta botão Premium para Mentores */}
          {user?.perfil_acess !== 'Mentor(a)' && (
            <Button
              variant={filter === 'premium' ? 'default' : 'outline'}
              onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
              className={cn(
                filter === 'premium' &&
                  'bg-violet-500 hover:bg-violet-600 text-white border-violet-500',
                filter !== 'premium' && 'bg-white text-zinc-700 border-zinc-200',
                'shadow-sm',
              )}
            >
              <Star className="h-4 w-4 mr-2" /> Premium/Quali.
            </Button>
          )}

          <Button
            onClick={() => {
              setNewTask({
                id: '',
                description: '',
                due_date: '',
                lead_id: '',
                client_id: '',
                tp_tarefa: '',
                user_resp: user?.id || '',
              })
              setIsCreateOpen(true)
            }}
            className="bg-[#052136] hover:bg-[#08304c] text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
          </Button>

          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as 'list' | 'calendar')}
            className="bg-white border border-zinc-200 rounded-lg p-1 shadow-sm"
          >
            <ToggleGroupItem value="list" className="h-8 px-3 text-xs data-[state=on]:bg-zinc-100">
              <List className="h-4 w-4 mr-2" /> Lista
            </ToggleGroupItem>
            <ToggleGroupItem
              value="calendar"
              className="h-8 px-3 text-xs data-[state=on]:bg-zinc-100"
            >
              <CalendarIcon className="h-4 w-4 mr-2" /> Calendário
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="px-8 pb-8 flex-1">{view === 'list' ? renderList() : renderCalendar()}</div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newTask.id ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Descrição da tarefa"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Tarefa</Label>
                <Select
                  value={newTask.tp_tarefa}
                  onValueChange={(v) => setNewTask({ ...newTask, tp_tarefa: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={newTask.user_resp}
                onValueChange={(v) => setNewTask({ ...newTask, user_resp: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {user?.perfil_acess !== 'Mentor(a)' && (
              <div className="space-y-2">
                <Label>Lead Relacionado</Label>
                <Select
                  value={newTask.lead_id}
                  onValueChange={(v) => setNewTask({ ...newTask, lead_id: v, client_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {user?.perfil_acess !== 'Vendedor' && (
              <div className="space-y-2">
                <Label>Cliente Relacionado</Label>
                <Select
                  value={newTask.client_id}
                  onValueChange={(v) => setNewTask({ ...newTask, client_id: v, lead_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.Aluno_a || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTask}
              className="bg-[#052136] hover:bg-[#08304c] text-white"
            >
              {newTask.id ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
