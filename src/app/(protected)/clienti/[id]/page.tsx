'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    ChevronLeft, FolderKanban, Phone, Mail, MapPin,
    Users as UsersIcon, Package, ChevronRight, Calendar,
    LayoutList, FolderOpen, CheckCircle2, Eye, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { getCliente, getProgettiByCliente, getInterventiByProgetto, deleteIntervento } from '@/lib/supabase/queries'
import { InterventoDialog } from '@/components/intervento-dialog'
import type { Cliente, Progetto } from '@/types/database'

export interface InterventoDettaglio {
    id: string
    data: string
    progetto: string
    progetto_id: string
    cliente: string
    note: string
    stato_contabile: 'da_contabilizzare' | 'conto_finito' | 'fatturato' | 'pagato'
    dipendenti: { nome: string; ore: number; costo_orario: number }[]
    materiali: { nome: string; quantita: number; prezzo: number; unita: string }[]
}

const statoLabel: Record<string, { label: string; color: string }> = {
    da_contabilizzare: { label: 'Da contab.', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    conto_finito: { label: 'Conto', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    fatturato: { label: 'Fatturato', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    pagato: { label: 'Pagato', color: 'bg-green-100 text-green-700 border-green-200' },
}

function mapIntervento(i: any, progNome: string, clienteNome: string): InterventoDettaglio {
    return {
        id: i.id, data: i.data, progetto: progNome, progetto_id: i.progetto_id, cliente: clienteNome, note: i.note || '', stato_contabile: i.stato_contabile,
        dipendenti: (i.interventi_manodopera || []).map((m: any) => ({ nome: `${m.dipendenti?.nome || ''} ${m.dipendenti?.cognome || ''}`.trim(), ore: Number(m.ore), costo_orario: Number(m.costo_orario) })),
        materiali: (i.interventi_materiali || []).map((m: any) => ({ nome: m.catalogo?.nome || '—', quantita: Number(m.quantita), prezzo: Number(m.prezzo_applicato), unita: m.catalogo?.unita_misura || 'pz' })),
    }
}

export default function ClienteDettaglioPage() {
    const params = useParams()
    const router = useRouter()
    const clienteId = params.id as string

    const [loading, setLoading] = useState(true)
    const [cliente, setCliente] = useState<Cliente | null>(null)
    const [progetti, setProgetti] = useState<any[]>([])
    const [interventiMap, setInterventiMap] = useState<Record<string, InterventoDettaglio[]>>({})

    const [viewMode, setViewMode] = useState<'progetti' | 'tabella'>('progetti')
    const [selectedProgettoId, setSelectedProgettoId] = useState<string | null>(null)
    const [contabilizzati, setContabilizzati] = useState<Set<string>>(new Set())
    const [selectedInterventoId, setSelectedInterventoId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [c, projs] = await Promise.all([getCliente(clienteId), getProgettiByCliente(clienteId)])
            setCliente(c)
            setProgetti(projs)

            const iMap: Record<string, InterventoDettaglio[]> = {}
            for (const p of projs) {
                const intervs = await getInterventiByProgetto(p.id)
                iMap[p.id] = intervs.map((i: any) => mapIntervento(i, p.nome, c.nome))
            }
            setInterventiMap(iMap)
        } catch { toast.error('Errore caricamento') }
        finally { setLoading(false) }
    }, [clienteId])

    useEffect(() => { loadData() }, [loadData])

    const allInterventi = Object.values(interventiMap).flat()
    const progettoSelezionato = progetti.find((p: any) => p.id === selectedProgettoId)
    const interventiProgetto = selectedProgettoId ? (interventiMap[selectedProgettoId] || []) : []

    const toggleContabilizzato = (id: string) => setContabilizzati(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
    const openIntervento = (id: string) => { setSelectedInterventoId(id); setDialogOpen(true) }
    const isProgettoAllContab = (progettoId: string) => { const intervs = interventiMap[progettoId] || []; return intervs.length > 0 && intervs.every(i => contabilizzati.has(i.id)) }



    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    if (!cliente) return (
        <div className="px-4 py-6 text-center"><p className="text-muted-foreground">Cliente non trovato</p>
            <Link href="/clienti"><Button variant="ghost" className="mt-4">← Torna ai clienti</Button></Link>
        </div>
    )

    const totaleCliente = allInterventi.reduce((sum, i) => sum + i.dipendenti.reduce((s, d) => s + d.ore * d.costo_orario, 0) + i.materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0), 0)
    const totaleNonContab = allInterventi.filter(i => i.stato_contabile === 'da_contabilizzare').reduce((sum, i) => sum + i.dipendenti.reduce((s, d) => s + d.ore * d.costo_orario, 0) + i.materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0), 0)

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => selectedProgettoId ? setSelectedProgettoId(null) : router.push('/clienti')} className="touch-target flex items-center justify-center rounded-lg hover:bg-muted"><ChevronLeft className="h-6 w-6" /></button>
                <div className="flex-1 min-w-0"><h1 className="text-xl md:text-2xl font-bold truncate">{cliente.nome}</h1><p className="text-sm text-muted-foreground">{selectedProgettoId && progettoSelezionato ? `📂 ${progettoSelezionato.nome}` : `${progetti.length} progett${progetti.length === 1 ? 'o' : 'i'}`}</p></div>
            </div>

            {!selectedProgettoId && (
                <>
                    <Card className="shadow-sm"><CardContent className="p-4">
                        <div className="flex flex-wrap gap-4 text-sm">
                            {cliente.telefono && <a href={`tel:${cliente.telefono}`} className="flex items-center gap-1.5 text-primary hover:underline"><Phone className="h-4 w-4" />{cliente.telefono}</a>}
                            {cliente.email && <a href={`mailto:${cliente.email}`} className="flex items-center gap-1.5 text-primary hover:underline"><Mail className="h-4 w-4" />{cliente.email}</a>}
                            {cliente.citta && <span className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{cliente.indirizzo}, {cliente.citta}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                            <div><p className="text-xs text-muted-foreground">Totale lavori</p><p className="text-xl font-bold">€{totaleCliente.toLocaleString()}</p></div>
                            <div><p className="text-xs text-muted-foreground">Da contabilizzare</p><p className="text-xl font-bold text-amber-600">€{totaleNonContab.toLocaleString()}</p></div>
                        </div>
                    </CardContent></Card>
                    <div className="flex items-center gap-2">
                        <Button variant={viewMode === 'progetti' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('progetti')} className="rounded-lg gap-1.5"><FolderOpen className="h-4 w-4" /> Per Progetto</Button>
                        <Button variant={viewMode === 'tabella' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('tabella')} className="rounded-lg gap-1.5"><LayoutList className="h-4 w-4" /> Tutti gli Interventi</Button>
                    </div>
                </>
            )}

            {/* Per Progetto */}
            {!selectedProgettoId && viewMode === 'progetti' && (
                <div className="space-y-2">
                    {progetti.map((p: any) => {
                        const intervs = interventiMap[p.id] || []
                        const totale = intervs.reduce((s, i) => s + i.dipendenti.reduce((a, d) => a + d.ore * d.costo_orario, 0) + i.materiali.reduce((a, m) => a + m.quantita * m.prezzo, 0), 0)
                        const daContab = intervs.filter(i => i.stato_contabile === 'da_contabilizzare').length
                        const allChecked = isProgettoAllContab(p.id)
                        return (
                            <Card key={p.id} className={cn('shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99]', allChecked && 'ring-2 ring-green-500/30')} onClick={() => setSelectedProgettoId(p.id)}>
                                <CardContent className="p-4 flex items-center gap-4">
                                    {allChecked ? <div className="h-10 w-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0"><CheckCircle2 className="h-5 w-5" /></div>
                                        : <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', p.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600')}><FolderKanban className="h-5 w-5" /></div>}
                                    <div className="flex-1 min-w-0"><p className="font-medium truncate">{p.nome}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="outline" className={cn('text-[10px]', p.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200')}>{p.tipologia === 'preventivo' ? '🔵 Prev.' : '🟢 Econ.'}</Badge>
                                            <span className="text-xs text-muted-foreground">{intervs.length} interv.</span>
                                            {daContab > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{daContab} da contab.</Badge>}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0"><p className="font-bold tabular-nums">€{totale.toLocaleString()}</p>{p.importo_preventivo && <p className="text-xs text-muted-foreground">/ €{Number(p.importo_preventivo).toLocaleString()}</p>}</div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                                </CardContent>
                            </Card>
                        )
                    })}
                    {progetti.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun progetto per questo cliente</p>}
                </div>
            )}

            {/* Tabella tutti */}
            {!selectedProgettoId && viewMode === 'tabella' && (
                <div className="space-y-1">
                    {allInterventi.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).map(interv => {
                        const totM = interv.dipendenti.reduce((s, d) => s + d.ore * d.costo_orario, 0)
                        const totMat = interv.materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0)
                        const totale = totM + totMat
                        const checked = contabilizzati.has(interv.id)
                        const stato = statoLabel[interv.stato_contabile]
                        return (
                            <Card key={interv.id} className={cn('shadow-sm transition-all', checked && 'bg-green-50/50 ring-1 ring-green-200')}>
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                        <Checkbox checked={checked} onCheckedChange={() => toggleContabilizzato(interv.id)} className="mt-1 h-5 w-5" />
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openIntervento(interv.id)}>
                                            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{new Date(interv.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span><Badge variant="outline" className={cn('text-[10px]', stato?.color)}>{stato?.label}</Badge></div>
                                            <p className="font-medium text-sm mt-0.5">{interv.progetto}</p>
                                            {interv.note && <p className="text-xs text-muted-foreground truncate">{interv.note}</p>}
                                            <div className="flex items-center justify-between mt-1.5 text-xs"><span className="text-muted-foreground">👷 €{totM.toFixed(0)} · 📦 €{totMat.toFixed(0)}</span><span className="font-bold">€{totale.toFixed(0)}</span></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                    {allInterventi.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun intervento registrato</p>}
                </div>
            )}

            {/* Drill-down progetto */}
            {selectedProgettoId && progettoSelezionato && (
                <div>
                    <Card className="shadow-sm mb-4"><CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn('text-xs', progettoSelezionato.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200')}>{progettoSelezionato.tipologia === 'preventivo' ? '🔵 A Preventivo' : '🟢 In Economia'}</Badge>
                            {progettoSelezionato.importo_preventivo && <p className="text-sm">Budget: <span className="font-bold">€{Number(progettoSelezionato.importo_preventivo).toLocaleString()}</span></p>}
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t text-center">
                            <div><p className="text-xs text-muted-foreground">Interventi</p><p className="text-lg font-bold">{interventiProgetto.length}</p></div>
                            <div><p className="text-xs text-muted-foreground">Totale</p><p className="text-lg font-bold">€{interventiProgetto.reduce((s, i) => s + i.dipendenti.reduce((a, d) => a + d.ore * d.costo_orario, 0) + i.materiali.reduce((a, m) => a + m.quantita * m.prezzo, 0), 0).toLocaleString()}</p></div>
                            <div><p className="text-xs text-muted-foreground">Contabilizzati</p><p className="text-lg font-bold">{interventiProgetto.filter(i => contabilizzati.has(i.id)).length}/{interventiProgetto.length}</p></div>
                        </div>
                    </CardContent></Card>
                    <div className="space-y-2">
                        {interventiProgetto.map(interv => {
                            const totM = interv.dipendenti.reduce((s, d) => s + d.ore * d.costo_orario, 0)
                            const totMat = interv.materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0)
                            const totale = totM + totMat
                            const checked = contabilizzati.has(interv.id)
                            const stato = statoLabel[interv.stato_contabile]
                            return (
                                <Card key={interv.id} className={cn('shadow-sm transition-all', checked && 'bg-green-50/50 ring-1 ring-green-200')}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Checkbox checked={checked} onCheckedChange={() => toggleContabilizzato(interv.id)} className="mt-1 h-5 w-5" />
                                            <div className="flex-1 cursor-pointer" onClick={() => openIntervento(interv.id)}>
                                                <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{new Date(interv.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}</span><Badge variant="outline" className={cn('text-[10px]', stato?.color)}>{stato?.label}</Badge></div>
                                                {interv.note && <p className="text-sm text-muted-foreground mb-2">{interv.note}</p>}
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center gap-1.5"><UsersIcon className="h-3.5 w-3.5 text-primary" /><span className="text-muted-foreground">{interv.dipendenti.map(d => d.nome).join(', ')}</span></div>
                                                    {interv.materiali.length > 0 && <div className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-blue-500" /><span className="text-muted-foreground">{interv.materiali.map(m => m.nome).join(', ')}</span></div>}
                                                </div>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm"><span className="text-muted-foreground">👷 €{totM.toFixed(0)} + 📦 €{totMat.toFixed(0)}</span><span className="text-lg font-bold tabular-nums">€{totale.toFixed(0)}</span></div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                        {interventiProgetto.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun intervento per questo progetto</p>}
                    </div>
                </div>
            )}

            <InterventoDialog interventoId={selectedInterventoId} open={dialogOpen} onOpenChange={setDialogOpen} onDeleted={loadData} onSaved={loadData} />
        </div>
    )
}
