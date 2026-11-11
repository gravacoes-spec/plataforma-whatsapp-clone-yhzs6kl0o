import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, Phone } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getLeads, type LeadRecord } from '@/services/leads'
import { formatBrPhone, normalizeBrPhone } from '@/lib/phone'
import { useToast } from '@/hooks/use-toast'

interface NovoChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectLead: (lead: LeadRecord) => Promise<void>
}

export function NovoChatDialog({ open, onOpenChange, onSelectLead }: NovoChatDialogProps) {
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [startingId, setStartingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    getLeads()
      .then((data) => {
        if (!cancelled) setLeads(data)
      })
      .catch((e) => {
        console.error('Failed to load leads:', e)
        if (!cancelled) toast({ variant: 'destructive', title: 'Erro ao carregar leads' })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setStartingId(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')
    return leads.filter(
      (l) =>
        (l.name || '').toLowerCase().includes(q) ||
        (qDigits.length > 0 && (l.phone || '').replace(/\D/g, '').includes(qDigits)),
    )
  }, [leads, search])

  const handleSelect = async (lead: LeadRecord) => {
    setStartingId(lead.id)
    try {
      await onSelectLead(lead)
    } finally {
      setStartingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Chat</DialogTitle>
          <DialogDescription>
            Escolha um lead para iniciar uma conversa no WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            className="pl-9 h-9 text-[13.5px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <ScrollArea className="h-72 -mx-2">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 p-10">Nenhum lead encontrado</p>
          ) : (
            <div className="p-2 space-y-px">
              {filtered.map((lead) => {
                const normalized = normalizeBrPhone(lead.phone)
                const disabled = !normalized || startingId !== null
                const reason = !lead.phone
                  ? 'Sem telefone'
                  : !normalized
                    ? 'Telefone inválido'
                    : null
                return (
                  <button
                    key={lead.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(lead)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-zinc-900 truncate">
                        {lead.name || 'Sem nome'}
                      </p>
                      <p className="text-[12.5px] text-zinc-500 truncate flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" />
                        {normalized ? formatBrPhone(normalized) : lead.phone || '—'}
                      </p>
                    </div>
                    {startingId === lead.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500 shrink-0" />
                    ) : (
                      reason && (
                        <span className="text-[11px] text-amber-700 shrink-0">{reason}</span>
                      )
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
