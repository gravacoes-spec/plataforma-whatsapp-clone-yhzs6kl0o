import { useEffect, useState } from 'react'
import { getTasks, updateTask, createTask, deleteTask } from '@/services/tasks'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<'all' | 'late'>('all')
  const [roleFilter, setRoleFilter] = useState<'vendedor' | 'mentor'>('vendedor')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const loadData = async () => {
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('tasks', () => loadData())
  useRealtime('whatsapp_instances', () => loadData())
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
      </div>
    )
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'late' && (t.completed || !t.due_date || !isPast(parseISO(t.due_date))))
      return false

    if (roleFilter === 'vendedor') {
      return !t.mentor_id
    } else {
      return !!t.mentor_id
    }
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
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200/60 shadow-sm transition-all hover:shadow-md"
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
          {days.map((day, i) => {
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

      <div className="px-8 pb-4">
        <ToggleGroup
          type="single"
          value={roleFilter}
          onValueChange={(v) => v && setRoleFilter(v as 'vendedor' | 'mentor')}
          className="justify-start"
        >
          <ToggleGroupItem
            value="vendedor"
            className="h-8 px-4 text-xs rounded-full data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700 border border-transparent data-[state=off]:border-zinc-200 data-[state=off]:bg-white"
          >
            Vendedor
          </ToggleGroupItem>
          <ToggleGroupItem
            value="mentor"
            className="h-8 px-4 text-xs rounded-full data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700 border border-transparent data-[state=off]:border-zinc-200 data-[state=off]:bg-white"
          >
            Mentor(a)
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="px-8 pb-8 flex-1">{view === 'list' ? renderList() : renderCalendar()}</div>
    </div>
  )
}
