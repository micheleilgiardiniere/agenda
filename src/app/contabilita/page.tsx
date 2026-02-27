'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getInterventi, updateInterventoStato } from '@/lib/supabase/queries'
import { InterventoDialog } from '@/components/intervento-dialog'

type Stato = 'da_contabilizzare' | 'conto_finito' | 'fatturato' | 'pagato'

const STATI: { key: Stato; label: string; short: string; color: string; Icon: React.ElementType }[] = [
    { key: 'da_contabilizzare', label: 'Da Contabilizzare', short: 'Da fare', color: 'text-amber-600', Icon: Clock },
    { key: 'conto_finito', label: 'Conto Finito', short: 'Conto', color: 'text-blue-600', Icon: FileText },
    { key: 'fatturato', label: 'Fatturato', short: 'Fatt.', color: 'text-purple-600', Icon: Receipt },
    { key: 'pagato', label: 'Pagato', short: 'Pagato', color: 'text-green-600', Icon: CheckCircle },
]

export default function ContabilitaPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedInterventoId, setSelectedInterventoId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const data = await getInterventi()
            const mapped = data.map((i: any) => {
                const totM = (i.interventi_manodopera || []).reduce((s: number, m: any) => s + Number(m.ore) * Number(m.costo_orario), 0)
                const totMat = (i.interventi_materiali || []).reduce((s: number, m: any) => s + Number(m.quantita) * Number(m.prezzo_applicato), 0)
                return { id: i.id, data: i.data, progetto: i.progetti?.nome || '—', cliente: i.progetti?.clienti?.nome || '—', totale: totM + totMat, stato: i.stato_contabile as Stato }
            })
            setItems(mapped)
        } catch { toast.error('Errore caricamento') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const advance = async (id: string) => {
        const order: Stato[] = ['da_contabilizzare', 'conto_finito', 'fatturato', 'pagato']
        const item = items.find(i => i.id === id)
        if (!item) return
        const idx = order.indexOf(item.stato)
        if (idx >= 3) return
        const next = order[idx + 1]
        try {
            await updateInterventoStato(id, next)
            setItems(prev => prev.map(i => i.id === id ? { ...i, stato: next } : i))
            toast.success('Stato aggiornato')
        } catch { toast.error('Errore aggiornamento') }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Contabilità</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {STATI.map(s => (
                    <Card key={s.key} className="shadow-sm">
                        <CardContent className="p-4 text-center">
                            <s.Icon className={cn('h-6 w-6 mx-auto mb-2', s.color)} />
                            <p className="text-2xl font-bold">{items.filter(i => i.stato === s.key).length}</p>
                            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="da_contabilizzare">
                <TabsList className="w-full grid grid-cols-4 bg-muted/50 rounded-xl h-auto p-1">
                    {STATI.map(s => (
                        <TabsTrigger key={s.key} value={s.key} className="rounded-lg text-xs py-2.5">
                            <span className="hidden sm:inline">{s.label}</span>
                            <span className="sm:hidden">{s.short}</span>
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{items.filter(i => i.stato === s.key).length}</Badge>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {STATI.map(s => (
                    <TabsContent key={s.key} value={s.key} className="mt-4 space-y-2">
                        {items.filter(i => i.stato === s.key).length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-8">Nessun intervento</p>
                        ) : items.filter(i => i.stato === s.key).map(item => {
                            const nextIdx = STATI.findIndex(x => x.key === item.stato) + 1
                            const next = nextIdx < STATI.length ? STATI[nextIdx] : null
                            return (
                                <Card key={item.id} className="shadow-sm">
                                    <CardContent className="p-4 flex flex-col h-full">
                                        <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => { setSelectedInterventoId(item.id); setDialogOpen(true); }}>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate hover:text-primary transition-colors">{item.progetto}</p>
                                                <p className="text-sm text-muted-foreground">{item.cliente} • {new Date(item.data).toLocaleDateString('it-IT')}</p>
                                            </div>
                                            <p className="text-lg font-bold tabular-nums">€{item.totale.toLocaleString()}</p>
                                        </div>
                                        {next && (
                                            <div className="mt-3 pt-3 border-t border-border/20 flex justify-end">
                                                <Button size="sm" variant="outline" onClick={() => advance(item.id)} className="rounded-lg gap-1.5 text-xs">
                                                    <next.Icon className="h-3.5 w-3.5" /> → {next.label}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </TabsContent>
                ))}
            </Tabs>

            <InterventoDialog interventoId={selectedInterventoId} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={loadData} onDeleted={loadData} />
        </div>
    )
}
