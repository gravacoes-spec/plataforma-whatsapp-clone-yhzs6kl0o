import { useEffect, useState, useCallback, useRef } from 'react'
import { getWebhookLogs, clearAllVendas } from '@/services/hotmart'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, Eye, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { importHotmartCsv } from '@/services/hotmart-import'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

export default function HotmartLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isAuthenticated, loading: authLoading } = useAuth()

  const loadLogs = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const data = await getWebhookLogs()
      setLogs(data.items)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    loadLogs()
  }, [loadLogs, authLoading])

  useRealtime('webhook_log', () => loadLogs(), isAuthenticated && !authLoading && !loading)

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const result = await importHotmartCsv(text)
      toast.success(
        `${result.imported} registros importados, ${result.clientesSynced} clientes sincronizados!`,
      )
      loadLogs()
    } catch (err) {
      toast.error('Erro ao importar CSV')
      console.error(err)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleClearVendas = async () => {
    setClearing(true)
    try {
      const count = await clearAllVendas()
      toast.success(`${count} registros de vendas removidos com sucesso!`)
      setClearDialogOpen(false)
    } catch (err) {
      toast.error('Erro ao limpar registros de vendas')
      console.error(err)
    } finally {
      setClearing(false)
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
      <PageHeader
        title="Logs de Webhook - Hotmart"
        description="Últimas 10 notificações recebidas"
      />
      <div className="px-8 pb-8 flex-1 flex flex-col">
        <div className="flex justify-end mb-4 gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCsv}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Importar CSV
          </Button>
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogAction className="hidden" asChild>
              <span />
            </AlertDialogAction>
            <Button
              onClick={() => setClearDialogOpen(true)}
              disabled={clearing}
              variant="destructive"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Limpar Vendas
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar todos os registros de vendas</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all records? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={clearing}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearVendas}
                  disabled={clearing}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Excluir Tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200/60 overflow-hidden shadow-sm flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                <TableHead>Data/Hora</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Buyer Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="w-[100px] text-right">Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const payload = log.payload_receb || {}
                const buyerName = payload.data?.buyer?.name || '-'
                const productName = payload.data?.product?.name || '-'
                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-zinc-600">
                      {log.data_receb
                        ? format(parseISO(log.data_receb), 'dd/MM/yyyy, HH:mm:ss', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          log.status === 'Invalid Token'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : log.status === 'success'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {log.status || 'unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-700">{buyerName}</TableCell>
                    <TableCell className="text-zinc-700">{productName}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Payload do Webhook</DialogTitle>
                          </DialogHeader>
                          <pre className="p-4 bg-zinc-950 text-zinc-50 rounded-lg text-xs overflow-x-auto">
                            {JSON.stringify(payload, null, 2)}
                          </pre>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
