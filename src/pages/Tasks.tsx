import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTasks, updateTask, createTask, deleteTask } from '@/services/tasks'
import { getLeads, LeadRecord } from '@/services/leads'
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

export default function Tasks() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState<any[]>([])
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<'all' | 'late' | 'premium'>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTask, setNewTask] = useState({ description: '', due_date: '', lead_id: '' })

  const loadData = async () => {
    try {
      const [taskData, leadData] = await Promise.all([getTasks(), getLeads()])
      setTasks(taskData)
      setLeads(leadData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const leadParam = searchParams.get('lead')
    if (leadParam) {
      setNewTask((prev) => ({ ...prev, lead_id: leadParam }))
      setIsCreateOpen(true)
    }
  }, [])

  useRealtime('tasks', () => loadData())
  useRealtime('Leads', () => loadData())

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
        completed: false,
        user_id: user?.id,
      }
      if (newTask.lead_id) {
        payload.lead_id = newTask.lead_id
      }
      await createTask(payload)
      toast.success('Tarefa criada')
      setIsCreateOpen(false)
      setNewTask({ description: '', due_date: '', lead_id: '' })
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('lead')
      setSearchParams(newParams)
      loadData()
    } catch {
      toast.error('Erro ao criar tarefa')
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    )
  }

  const filteredTasks = tasks.filter((t) => {
    if (t.user_id !== user?.id) return false

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
              <div className="flex items-center gap-3 mt-1">
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
                {t.expand?.lead_id && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-medium truncate max-w-[200px]">
                    Lead: {t.expand.lead_id.name}
                  </span>
                )}
                {t.expand?.client_id && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium truncate max-w-[200px]">
                    Cliente: {t.expand.client_id.Aluno_a}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDeleteTask(t.id)}
              className="shrink-0 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
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
      <div className="bg-white rounded-xl border border-zinc-200/60 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="text-lg font-bold text-zinc-900 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
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
                    isToday(day) ? 'bg-violet-600 text-white' : 'text-zinc-600',
                  )}
                >
                  {format(day, 'd')}
                </div>
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      'text-[10px] px-1.5 py-1 rounded border truncate cursor-pointer transition-colors',
                      t.completed
                        ? 'bg-zinc-50 text-zinc-400 border-zinc-200 line-through'
                        : isPast(day) && !isToday(day)
                          ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                          : 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100',
                    )}
                    onClick={() => toggleTask(t)}
                  >
                    {t.description}
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
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Minhas Tarefas</h1>
          <p className="text-sm text-zinc-500 mt-1">Acompanhe suas pendências e compromissos.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={filter === 'late' ? 'default' : 'outline'}
            onClick={() => setFilter(filter === 'late' ? 'all' : 'late')}
            className={cn(
              filter === 'late' && 'bg-red-500 hover:bg-red-600 text-white',
              filter !== 'late' && 'bg-white text-zinc-700',
            )}
          >
            <AlertTriangle className="h-4 w-4 mr-2" /> Atrasadas ({lateCount})
          </Button>
          <Button
            variant={filter === 'premium' ? 'default' : 'outline'}
            onClick={() => setFilter(filter === 'premium' ? 'all' : 'premium')}
            className={cn(
              filter === 'premium' && 'bg-violet-500 hover:bg-violet-600 text-white',
              filter !== 'premium' && 'bg-white text-zinc-700',
            )}
          >
            <Star className="h-4 w-4 mr-2" /> Premium/Qualificado
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Tarefa
          </Button>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as 'list' | 'calendar')}
            className="bg-white border border-zinc-200 rounded-lg p-1"
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
            <DialogTitle>Nova Tarefa</DialogTitle>
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
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Lead Relacionado</Label>
              <Select
                value={newTask.lead_id}
                onValueChange={(v) => setNewTask({ ...newTask, lead_id: v })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTask}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
