'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, CheckCircle, Clock, FileText, Loader2, ArrowRightLeft, Plus, Euro, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getInterventi, updateInterventoStato, getDocumenti, insertPagamento } from '@/lib/supabase/queries'
import { InterventoDialog } from '@/components/intervento-dialog'

type Stato = 'da_contabilizzare' | 'conto_finito' | 'fatturato' | 'pagato'

const STATI: { key: Stato; label: string; short: string; color: string; Icon: React.ElementType }[] = [
    { key: 'da_contabilizzare', label: 'Da Contabilizzare', short: 'Da fare', color: 'text-amber-600', Icon: Clock },
    { key: 'conto_finito', label: 'Conto Finito', short: 'Conto', color: 'text-blue-600', Icon: FileText },
    { key: 'fatturato', label: 'Fatturato / Doc. Creato', short: 'Fatt.', color: 'text-purple-600', Icon: Receipt },
    { key: 'pagato', label: 'Pagato', short: 'Pagato', color: 'text-green-600', Icon: CheckCircle },
]

export default function ContabilitaPage() {
    const [view, setView] = useState<'lavori' | 'incassi'>('lavori')
    const [loading, setLoading] = useState(true)

    // Lavori state
    const [items, setItems] = useState<any[]>([])
    const [selectedInterventoId, setSelectedInterventoId] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Incassi state
    const [documenti, setDocumenti] = useState<any[]>([])
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [paymentDoc, setPaymentDoc] = useState<any>(null)
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('contanti')
    const [savingPayment, setSavingPayment] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [ints, docs] = await Promise.all([getInterventi(), getDocumenti()])

            const mapped = ints.map((i: any) => {
                const totM = (i.interventi_manodopera || []).reduce((s: number, m: any) => s + Number(m.ore) * Number(m.costo_orario), 0)
                const totMat = (i.interventi_materiali || []).reduce((s: number, m: any) => s + Number(m.quantita) * Number(m.prezzo_applicato), 0)
                return { id: i.id, data: i.data, progetto: i.progetti?.nome || '—', cliente: i.progetti?.clienti?.nome || '—', totale: totM + totMat, stato: i.stato_contabile as Stato }
            })
            setItems(mapped)
            setDocumenti(docs)
        } catch { toast.error('Errore caricamento') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    // --- Lavori Logic ---
    const advance = async (id: string, currentStato: string) => {
        // Se si trova in conto_finito e va in fatturato, l'utente dovrebbe usare la pagina Fatturazione.
        if (currentStato === 'conto_finito') {
            toast.info('Usa la pagina Fatturazione per creare un documento da questo lavoro.')
            return
        }

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

    // --- Pagamenti Logic ---
    const openPaymentDialog = (doc: any) => {
        setPaymentDoc(doc)
        const pagato = doc.pagamenti?.reduce((acc: number, p: any) => acc + Number(p.importo), 0) || 0
        const daPagare = Number(doc.totale) - pagato
        setPaymentAmount(daPagare > 0 ? daPagare.toFixed(2) : '')
        setPaymentMethod('contanti')
        setPaymentDialogOpen(true)
    }

    const handleSavePayment = async () => {
        if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) return toast.error('Importo non valido')
        setSavingPayment(true)
        try {
            await insertPagamento({
                documento_id: paymentDoc.id,
                importo: Number(paymentAmount),
                metodo: paymentMethod,
                data: new Date().toISOString().split('T')[0]
            })
            toast.success('Pagamento registrato')
            setPaymentDialogOpen(false)
            await loadData() // Ricarica incassi e doc
        } catch { toast.error('Errore registrazione pagamento') }
        finally { setSavingPayment(false) }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    const docDaRiscuotere = documenti.filter(doc => {
        const pagato = doc.pagamenti?.reduce((a: number, b: any) => a + Number(b.importo), 0) || 0
        return Number(doc.totale) - pagato > 0.01
    })

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Contabilità</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestisci stati lavori e registra gli incassi.</p>
                </div>
                <div className="flex bg-muted/50 p-1 rounded-xl shrink-0">
                    <button onClick={() => setView('lavori')} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-all', view === 'lavori' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Flusso Lavori</button>
                    <button onClick={() => setView('incassi')} className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-all', view === 'incassi' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Incassi e Pagamenti</button>
                </div>
            </div>

            {view === 'lavori' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
                        <TabsList className="w-full grid grid-cols-4 bg-muted/50 rounded-xl h-auto p-1 overflow-x-auto">
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
                                    <p className="text-muted-foreground text-sm text-center py-8">Nessun intervento in questo stato.</p>
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
                                                        {item.stato === 'conto_finito' ? (
                                                            <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs text-muted-foreground" disabled>
                                                                Passa da Fatturazione
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="outline" onClick={() => advance(item.id, item.stato)} className="rounded-lg gap-1.5 text-xs">
                                                                <next.Icon className="h-3.5 w-3.5" /> → {next.label}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            )}

            {view === 'incassi' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary"><ReceiptText className="h-6 w-6" /></div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium">Documenti Emessi</p>
                                        <p className="text-3xl font-bold">{documenti.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-orange-200 text-orange-600 dark:bg-orange-900 dark:text-orange-400 flex items-center justify-center"><Euro className="h-6 w-6" /></div>
                                    <div>
                                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Da Riscuotere</p>
                                        <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                                            €{docDaRiscuotere.reduce((acc, doc) => acc + (Number(doc.totale) - doc.pagamenti?.reduce((a: number, b: any) => a + Number(b.importo), 0)), 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <h2 className="text-lg font-semibold pt-2">Scadenziario (Da Pagare)</h2>

                    {docDaRiscuotere.length === 0 ? (
                        <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">Nessun documento in sospeso!</p>
                            <p className="text-sm text-muted-foreground mt-1">Tutti i conti e fatture sono stati saldati.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {docDaRiscuotere.map(doc => {
                                const pagato = doc.pagamenti?.reduce((a: number, b: any) => a + Number(b.importo), 0) || 0
                                const daPagare = Number(doc.totale) - pagato

                                return (
                                    <Card key={doc.id} className="shadow-sm">
                                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider">{doc.tipo} {doc.numero}</Badge>
                                                    <span className="text-sm text-muted-foreground">{new Date(doc.data_emissione).toLocaleDateString()}</span>
                                                </div>
                                                <p className="font-semibold">{doc.clienti?.nome}</p>
                                                <p className="text-sm text-muted-foreground">Totale: €{Number(doc.totale).toLocaleString()} {pagato > 0 && `(Pagato: €${pagato.toLocaleString()})`}</p>
                                            </div>

                                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-border/10">
                                                <div className="text-left md:text-right">
                                                    <p className="text-xs text-muted-foreground">Da saldare</p>
                                                    <p className="text-xl font-bold text-destructive">€{daPagare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                                <Button size="sm" onClick={() => openPaymentDialog(doc)} className="rounded-xl touch-target shrink-0 gap-1.5"><Plus className="h-4 w-4" /> Pagamento</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Registra Pagamento</DialogTitle>
                    </DialogHeader>
                    {paymentDoc && (
                        <div className="space-y-4 pt-4">
                            <div className="bg-muted p-3 rounded-lg flex justify-between items-center text-sm">
                                <span className="text-muted-foreground capitalize">{paymentDoc.tipo} {paymentDoc.numero}</span>
                                <span className="font-bold">{paymentDoc.clienti?.nome}</span>
                            </div>

                            <div className="space-y-2">
                                <Label>Importo (€)</Label>
                                <Input type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-12 text-lg font-bold" />
                            </div>

                            <div className="space-y-2">
                                <Label>Metodo</Label>
                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full h-12 rounded-lg border border-input bg-background px-3">
                                    <option value="contanti">Contanti</option>
                                    <option value="bonifico">Bonifico</option>
                                    <option value="assegno">Assegno</option>
                                    <option value="carta">Pos / Carta</option>
                                </select>
                            </div>

                            <Button className="w-full h-12 rounded-xl mt-4 text-base font-semibold" disabled={savingPayment} onClick={handleSavePayment}>
                                {savingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Conferma Incasso'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <InterventoDialog interventoId={selectedInterventoId} open={dialogOpen} onOpenChange={setDialogOpen} onSaved={loadData} onDeleted={loadData} />
        </div>
    )
}
