import { useEffect, useState, useMemo } from 'react'
import { getLeads, LeadRecord } from '@/services/leads'
import { getMetas, MetaRecord } from '@/services/metas'
import { getUsers } from '@/services/users'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { PageHeader } from '@/components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  DollarSign,
  Users,
  Filter,
  Handshake,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { subDays, isAfter, isBefore, startOfDay, endOfDay, parseISO } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'

export default function Index() {
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [metas, setMetas] = useState<MetaRecord[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sellerId, setSellerId] = useState('todos')
  const [lossModalOpen, setLossModalOpen] = useState(false)

  const loadData = async () => {
    try {
      const [l, m, s, v] = await Promise.all([
        getLeads(),
        getMetas(),
        getUsers(),
        pb.collection('vendas_hotmart').getFullList(),
      ])
      setLeads(l)
      setMetas(m)
      setSellers(s.filter((u) => u.perfil_acess === 'Vendedor'))
      setVendas(v)
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
  useRealtime('Metas', () => loadData())
  useRealtime('vendas_hotmart', () => loadData())

  const { filteredLeads, filteredVendas, filteredMetas } = useMemo(() => {
    const now = new Date()
    const startDate =
      period === 'custom' && customStart
        ? startOfDay(parseISO(customStart))
        : startOfDay(subDays(now, parseInt(period) || 30))
    const endDate = period === 'custom' && customEnd ? endOfDay(parseISO(customEnd)) : endOfDay(now)

    const fLeads = leads.filter((l) => {
      const d = parseISO(l.created)
      const dateMatch = isAfter(d, startDate) && isBefore(d, endDate)
      const sellerMatch = sellerId === 'todos' || l.vend_resp === sellerId
      return dateMatch && sellerMatch
    })

    const fVendas = vendas.filter((v) => {
      const d = v.data_pedido ? parseISO(v.data_pedido) : parseISO(v.created)
      const dateMatch = isAfter(d, startDate) && isBefore(d, endDate)

      let sellerMatch = true
      if (sellerId !== 'todos') {
        const lead = leads.find((l) => l.id === v.lead_id)
        if (lead && lead.vend_resp !== sellerId) sellerMatch = false
        if (!lead) sellerMatch = false
      }
      return dateMatch && sellerMatch
    })

    const fMetas = metas.filter((m) => {
      const dateMatch = true
      const sellerMatch = sellerId === 'todos' || m.vend_resp === sellerId
      return dateMatch && sellerMatch
    })

    return { filteredLeads: fLeads, filteredVendas: fVendas, filteredMetas: fMetas }
  }, [leads, vendas, metas, period, sellerId])

  const kpis = useMemo(() => {
    const validVendas = filteredVendas.filter(
      (v) => v.status_compra === 'APPROVED' || v.status_compra === 'COMPLETE',
    )
    const fatTotal = validVendas.reduce((acc, v) => acc + (v.preco_total || 0), 0)
    const qtVendas = validVendas.length
    const leadsTotais = filteredLeads.length
    const convGeral = leadsTotais > 0 ? ((qtVendas / leadsTotais) * 100).toFixed(1) : '0.0'
    const perdas = filteredLeads.filter(
      (l) => l.etapa_pipeline === '10. Lead Desqualificado/Perda',
    ).length

    return { fatTotal, qtVendas, leadsTotais, convGeral, perdas }
  }, [filteredLeads, filteredVendas])

  const funnelData = useMemo(() => {
    const stages = [
      { id: '1. Novo Lead', label: 'Novo Lead', color: '#3b82f6' },
      { id: '3. Lead Premium', label: 'Lead Premium', color: '#10b981' },
      { id: '4. Lead Qualificado', label: 'Lead Qualificado', color: '#f59e0b' },
      { id: '5. Lead em Nutrição', label: 'Lead em Nutrição', color: '#8b5cf6' },
      {
        id: '6. Agendamento de Consultoria',
        label: 'Agendamento de Consultoria',
        color: '#6366f1',
      },
      { id: '9. Follow-up', label: 'Follow-up', color: '#64748b' },
    ]

    return stages.map((stage, idx) => {
      const count = filteredLeads.filter((l) => l.etapa_pipeline === stage.id).length
      const width = Math.max(10, 100 - idx * 15)
      return { ...stage, count, width }
    })
  }, [filteredLeads])

  const chartData = useMemo(() => {
    const agg = {
      Leads: { meta: 0, realizado: 0 },
      Abordagens: { meta: 0, realizado: 0 },
      Consultas: { meta: 0, realizado: 0 },
      Vendas: { meta: 0, realizado: 0 },
      Faturamento: { meta: 0, realizado: 0 },
    }

    filteredMetas.forEach((m) => {
      agg.Leads.meta += m.m_leads_recebidos || 0
      agg.Leads.realizado += m.r_leads_recebidos || 0
      agg.Abordagens.meta += m.m_abord_prospec_ativa || 0
      agg.Abordagens.realizado += m.r_abord_prospec_ativa || 0
      agg.Consultas.meta += m.m_apresent_consult || 0
      agg.Consultas.realizado += m.r_apresent_consult || 0
      agg.Vendas.meta += m.m_vendas || 0
      agg.Vendas.realizado += m.r_vendas || 0
      agg.Faturamento.meta += m.m_faturamento || 0
      agg.Faturamento.realizado += m.r_faturamento || 0
    })

    return [
      { name: 'Leads', Meta: agg.Leads.meta, Realizado: agg.Leads.realizado },
      { name: 'Abordagens', Meta: agg.Abordagens.meta, Realizado: agg.Abordagens.realizado },
      { name: 'Consultas', Meta: agg.Consultas.meta, Realizado: agg.Consultas.realizado },
      { name: 'Vendas', Meta: agg.Vendas.meta, Realizado: agg.Vendas.realizado },
      { name: 'Faturamento', Meta: agg.Faturamento.meta, Realizado: agg.Faturamento.realizado },
    ]
  }, [filteredMetas])

  const lossReasonsData = useMemo(() => {
    const lost = filteredLeads.filter((l) => l.etapa_pipeline === '10. Lead Desqualificado/Perda')
    const map = lost.reduce(
      (acc, l) => {
        const r = l.motivo_perda || 'Não informado'
        acc[r] = (acc[r] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [filteredLeads])

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#6366f1']

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200/60 bg-white/80 backdrop-blur-md px-8 py-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard de Vendas</h1>
          <p className="text-sm text-zinc-500">
            Acompanhe seus resultados comerciais em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
            <Filter className="h-4 w-4 text-zinc-400 ml-2" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[130px] border-0 focus:ring-0 h-8 shadow-none bg-transparent">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            {period === 'custom' && (
              <div className="flex items-center gap-1 ml-2 border-l pl-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-7 text-xs w-[120px]"
                />
                <span className="text-zinc-400">-</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-7 text-xs w-[120px]"
                />
              </div>
            )}
            <div className="w-[1px] h-4 bg-zinc-200 mx-1"></div>
            <Select value={sellerId} onValueChange={setSellerId}>
              <SelectTrigger className="w-[160px] border-0 focus:ring-0 h-8 shadow-none bg-transparent">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Vendedores</SelectItem>
                {sellers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="shadow-sm border-zinc-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-[13px] font-medium text-zinc-500">
                Faturamento Total
              </CardTitle>
              <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-zinc-900">
                R$ {kpis.fatTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-zinc-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-[13px] font-medium text-zinc-500">
                Vendas Realizadas
              </CardTitle>
              <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <Handshake className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-zinc-900">{kpis.qtVendas}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-zinc-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-[13px] font-medium text-zinc-500">Leads Totais</CardTitle>
              <div className="h-8 w-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-zinc-900">{kpis.leadsTotais}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-zinc-200/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-[13px] font-medium text-zinc-500">
                Conversão Geral
              </CardTitle>
              <div className="h-8 w-8 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-zinc-900">{kpis.convGeral}%</div>
            </CardContent>
          </Card>
          <Card
            className="shadow-sm border-zinc-200/60 cursor-pointer hover:border-red-300 transition-colors"
            onClick={() => setLossModalOpen(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-[13px] font-medium text-zinc-500">
                Análise de Perda
              </CardTitle>
              <div className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-zinc-900">{kpis.perdas}</div>
              <p className="text-xs text-zinc-400 mt-1">Clique para ver detalhes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm border-zinc-200/60 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Motivos de Perda</CardTitle>
              <p className="text-sm text-zinc-500">Distribuição dos leads desqualificados</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-2 h-[350px]">
              {lossReasonsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lossReasonsData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {lossReasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e4e4e7',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                  Nenhuma perda no período
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200/60 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Funil de Vendas</CardTitle>
              <p className="text-sm text-zinc-500">Distribuição de leads por etapa</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center py-6">
              <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-2">
                {funnelData.map((stage) => (
                  <div key={stage.id} className="w-full flex items-center relative group">
                    <div className="w-[180px] text-right pr-4 text-sm font-medium text-zinc-700 shrink-0">
                      {stage.label}
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div
                        className="h-12 rounded-lg flex items-center justify-center text-white font-bold transition-all shadow-sm relative"
                        style={{ width: `${stage.width}%`, backgroundColor: stage.color }}
                      >
                        {stage.count}
                        <div className="absolute opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-xs rounded py-1 px-2 -top-8 whitespace-nowrap transition-opacity pointer-events-none z-10">
                          {stage.count} Leads
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Meta versus Realizado</CardTitle>
              <p className="text-sm text-zinc-500">Comparativo de metas e resultados do período</p>
            </CardHeader>
            <CardContent className="pt-4 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e4e4e7',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Meta" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Realizado" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={lossModalOpen} onOpenChange={setLossModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalhamento de Perdas</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads
                  .filter((l) => l.etapa_pipeline === '10. Lead Desqualificado/Perda')
                  .map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.name || 'Sem nome'}</TableCell>
                      <TableCell>{(l as any).expand?.vend_resp?.name || '-'}</TableCell>
                      <TableCell className="text-red-600">{l.motivo_perda || '-'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
