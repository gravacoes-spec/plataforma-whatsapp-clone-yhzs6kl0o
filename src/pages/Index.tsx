import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { getLeads } from '@/services/leads'
import { getMetas } from '@/services/metas'
import { Loader2, TrendingUp, Users, Target, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [metaData, setMetaData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({ leads: 0, premium: 0, sales: 0, revenue: 0 })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leads, metas] = await Promise.all([getLeads(), getMetas()])

        // Filter by user if Vendedor, or show all if Gestor/Suporte
        const isVendedor = user?.perfil_acess === 'Vendedor'
        const relevantLeads = isVendedor ? leads.filter((l: any) => l.vend_resp === user.id) : leads
        const relevantMetas = isVendedor ? metas.filter((m: any) => m.vend_resp === user.id) : metas

        // Funnel
        const stages = [
          '1. Novo Lead',
          '2. Abordagem',
          '3. Lead Premium',
          '4. Lead Qualificado',
          '5. Lead em Nutrição',
          '6. Agendamento de Consultoria',
          '7. Negociação',
          '8. Venda Realizada',
          '9. Follow-up',
        ]

        const fData = stages.map((stage) => ({
          name: stage.replace(/^\d+\.\s/, ''),
          quantidade: relevantLeads.filter((l: any) => l.etapa_pipeline === stage).length,
        }))
        setFunnelData(fData)

        // Meta vs Realizado
        const totalMetas = relevantMetas.reduce((acc: number, m: any) => acc + (m.m_vendas || 0), 0)
        const totalRealizado = relevantMetas.reduce(
          (acc: number, m: any) => acc + (m.r_vendas || 0) + (m.ajuste_vendas || 0),
          0,
        )
        const totalFaturMeta = relevantMetas.reduce(
          (acc: number, m: any) => acc + (m.m_faturamento || 0),
          0,
        )
        const totalFaturRealizado = relevantMetas.reduce(
          (acc: number, m: any) => acc + (m.r_faturamento || 0) + (m.ajuste_faturamento || 0),
          0,
        )

        setMetaData([
          { name: 'Vendas', Meta: totalMetas, Realizado: totalRealizado },
          { name: 'Faturamento (R$)', Meta: totalFaturMeta, Realizado: totalFaturRealizado },
        ])

        // Top Metrics
        setMetrics({
          leads: relevantLeads.length,
          premium: relevantLeads.filter(
            (l: any) =>
              l.etapa_pipeline === '3. Lead Premium' || l.etapa_pipeline === '4. Lead Qualificado',
          ).length,
          sales: relevantLeads.filter((l: any) => l.etapa_pipeline === '8. Venda Realizada').length,
          revenue: totalFaturRealizado,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    if (user) loadData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 p-8 space-y-6 overflow-y-auto">
      <PageHeader
        title="Dashboard Comercial (BI)"
        description="Acompanhe os resultados de vendas e desempenho do funil."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{metrics.leads}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Leads Premium/Qualif.
            </CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{metrics.premium}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Vendas Realizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{metrics.sales}</div>
          </CardContent>
        </Card>
        <Card className="border-zinc-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">
              Faturamento Realizado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                metrics.revenue,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        <Card className="flex flex-col border-zinc-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-800">Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-6 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 12, fill: '#52525b' }}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="quantidade" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index >= 7 ? '#10b981' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-zinc-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-zinc-800">
              Meta vs Realizado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-6 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fill: '#52525b' }} />
                <YAxis tick={{ fill: '#52525b' }} />
                <RechartsTooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Meta" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={80} />
                <Bar dataKey="Realizado" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
