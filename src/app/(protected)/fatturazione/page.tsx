'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Plus, ReceiptText, CheckSquare, Square, FileCheck2 } from 'lucide-react'
import { getDocumenti, getClienti, getInterventiDaFatturare, insertDocumento } from '@/lib/supabase/queries'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types/database'

export default function FatturazionePage() {
    const [documenti, setDocumenti] = useState<any[]>([])
    const [clienti, setClienti] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [selectedCliente, setSelectedCliente] = useState('')

    const [interventiDisp, setInterventiDisp] = useState<any[]>([])
    const [loadingInterventi, setLoadingInterventi] = useState(false)
    const [selectedIntIds, setSelectedIntIds] = useState<string[]>([])

    // Document form
    const [numero, setNumero] = useState('')
    const [tipo, setTipo] = useState('conto')
    const [scontoPercentuale, setScontoPercentuale] = useState('')
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            const [docs, cls] = await Promise.all([getDocumenti(), getClienti()])
            setDocumenti(docs)
            setClienti(cls)
        } catch { toast.error('Errore caricamento') }
        finally { setLoading(false) }
    }

    // Effect logic for selecting a client
    useEffect(() => {
        if (!selectedCliente) {
            setInterventiDisp([])
            return
        }
        const loadInts = async () => {
            setLoadingInterventi(true)
            try {
                const res = await getInterventiDaFatturare(selectedCliente)
                setInterventiDisp(res)
                setSelectedIntIds(res.map(r => r.id)) // select all by default
            } catch { toast.error('Errore caricamento lavori') }
            finally { setLoadingInterventi(false) }
        }
        loadInts()
    }, [selectedCliente])

    const resetDialog = () => {
        setStep(1)
        setSelectedCliente('')
        setInterventiDisp([])
        setSelectedIntIds([])
        setNumero('')
        setTipo('conto')
        setScontoPercentuale('')
        setNote('')
    }

    const toggleInt = (id: string) => {
        setSelectedIntIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    }

    // Calcolo totali step 3
    const selectedIntsData = interventiDisp.filter(i => selectedIntIds.includes(i.id))

    let subTotale = 0
    const righeGenerate: any[] = []

    selectedIntsData.forEach(int => {
        const d = new Date(int.data).toLocaleDateString('it-IT')

        let intManodopera = 0
        int.interventi_manodopera?.forEach((m: any) => intManodopera += Number(m.ore) * Number(m.costo_orario))

        let intMateriali = 0
        int.interventi_materiali?.forEach((m: any) => intMateriali += Number(m.quantita) * Number(m.prezzo_applicato))

        subTotale += intManodopera + intMateriali

        if (intManodopera + intMateriali > 0) {
            righeGenerate.push({
                descrizione: `Lavori del ${d} presso ${int.progetti?.nome}`,
                quantita: 1,
                prezzo_unitario: intManodopera + intMateriali,
                totale_riga: intManodopera + intMateriali,
                intervento_id: int.id
            })
        }
    })

    const scontoValue = scontoPercentuale ? (subTotale * parseFloat(scontoPercentuale)) / 100 : 0
    const totale = subTotale - scontoValue

    const handleSave = async () => {
        if (selectedIntIds.length === 0) return toast.error('Seleziona almeno un intervento')
        if (!numero.trim()) return toast.error('Inserisci il numero documento')

        setSaving(true)
        try {
            const docData = {
                cliente_id: selectedCliente,
                numero,
                tipo,
                subtotale: subTotale,
                sconto_percentuale: parseFloat(scontoPercentuale) || 0,
                sconto_importo: scontoValue,
                totale: totale,
                note: note || null,
                stato: 'conto_finito'
            }

            await insertDocumento(docData, righeGenerate, selectedIntIds)
            toast.success('Documento creato con successo')
            setDialogOpen(false)
            resetDialog()
            await loadData()
        } catch { toast.error('Errore creazione documento') }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Fatturazione e Conti</h1>
                    <p className="text-sm text-muted-foreground mt-1">Gestisci i documenti e aggregazione lavori.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetDialog() }}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="touch-target gap-2 rounded-xl font-semibold"><Plus className="h-5 w-5" /> Nuovo Documento</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Generazione Conto / Fattura</DialogTitle>
                        </DialogHeader>

                        <div className="pt-4">
                            {/* STEPS INDICATOR */}
                            <div className="flex items-center gap-2 mb-6">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={cn("flex-1 h-2 rounded-full", step >= s ? "bg-primary" : "bg-muted")} />
                                ))}
                            </div>

                            {/* STEP 1: CLIENTE */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">1. Seleziona Cliente</h3>
                                    <p className="text-sm text-muted-foreground">Scegli il cliente per cui generare il documento.</p>
                                    <select
                                        value={selectedCliente}
                                        onChange={e => setSelectedCliente(e.target.value)}
                                        className="w-full h-12 rounded-lg border border-input bg-background px-3 text-base"
                                    >
                                        <option value="">Seleziona...</option>
                                        {clienti.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>

                                    <div className="pt-4">
                                        <Button
                                            className="w-full rounded-xl touch-target font-semibold h-12"
                                            disabled={!selectedCliente || loadingInterventi}
                                            onClick={() => setStep(2)}
                                        >
                                            {loadingInterventi ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Prosegui'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: INTERVENTI */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">2. Seleziona Lavori</h3>
                                    <p className="text-sm text-muted-foreground">Lavori finiti da includere nel documento.</p>

                                    {interventiDisp.length === 0 ? (
                                        <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed">
                                            <p className="text-muted-foreground text-sm">Nessun lavoro pendente o tutto già fatturato per questo cliente.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                            {interventiDisp.map(int => {
                                                const selected = selectedIntIds.includes(int.id)
                                                return (
                                                    <Card key={int.id} onClick={() => toggleInt(int.id)} className={cn("cursor-pointer transition-colors", selected ? "border-primary bg-primary/5" : "hover:border-primary/50")}>
                                                        <CardContent className="p-3 flex items-start gap-3">
                                                            <div className="mt-0.5 shrink-0 text-primary">
                                                                {selected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 opacity-50" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{new Date(int.data).toLocaleDateString('it-IT')} • {int.progetti?.nome}</p>
                                                                {int.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{int.note}</p>}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1 rounded-xl touch-target h-12" onClick={() => setStep(1)}>Indietro</Button>
                                        <Button className="flex-1 rounded-xl touch-target font-semibold h-12" disabled={selectedIntIds.length === 0} onClick={() => setStep(3)}>Prosegui</Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: DETTAGLI DOC */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">3. Dettagli Documento</h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Tipo</Label>
                                            <select value={tipo} onChange={e => setTipo(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
                                                <option value="conto">Pro-forma / Conto</option>
                                                <option value="fattura">Fattura</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label>Num. Documento *</Label>
                                            <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Es. 2026/01" className="mt-1" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label>Sconto %</Label>
                                            <Input type="number" min="0" max="100" value={scontoPercentuale} onChange={e => setScontoPercentuale(e.target.value)} placeholder="Es. 10" className="mt-1" />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>Note al cliente</Label>
                                        <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Ringraziamenti, IBAN, ecc." className="mt-1" />
                                    </div>

                                    <div className="bg-muted p-4 rounded-xl space-y-2 text-sm mt-4">
                                        <div className="flex justify-between"><span>Lavori selezionati:</span> <span>{selectedIntIds.length}</span></div>
                                        <div className="flex justify-between"><span>Subtotale:</span> <span>€{subTotale.toFixed(2)}</span></div>
                                        {scontoValue > 0 && <div className="flex justify-between text-green-600"><span>Sconto ({scontoPercentuale}%):</span> <span>-€{scontoValue.toFixed(2)}</span></div>}
                                        <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Totale:</span> <span className="text-primary">€{totale.toFixed(2)}</span></div>
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                        <Button variant="outline" className="flex-1 rounded-xl touch-target h-12" onClick={() => setStep(2)}>Indietro</Button>
                                        <Button className="flex-1 flex-[2] rounded-xl touch-target font-semibold gap-2 h-12" disabled={saving} onClick={handleSave}>
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                                            Salva Documento
                                        </Button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* TABELLA DOCUMENTI */}
            <Card className="border-0 shadow-sm ring-1 ring-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Tipo & Num</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="text-right">Totale</TableHead>
                                <TableHead className="text-right">Da Pagare</TableHead>
                                <TableHead className="text-center">Stato</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documenti.map(doc => {
                                const pagato = doc.pagamenti?.reduce((acc: number, p: any) => acc + Number(p.importo), 0) || 0
                                const daPagare = Number(doc.totale) - pagato
                                const saldato = daPagare <= 0.01

                                return (
                                    <TableRow key={doc.id}>
                                        <TableCell className="whitespace-nowrap">{new Date(doc.data_emissione).toLocaleDateString('it-IT')}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-primary capitalize">{doc.tipo} {doc.numero}</div>
                                        </TableCell>
                                        <TableCell className="font-medium">{doc.clienti?.nome}</TableCell>
                                        <TableCell className="text-right tabular-nums whitespace-nowrap font-bold">€{Number(doc.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                                            {saldato ? (
                                                <span className="text-muted-foreground">—</span>
                                            ) : (
                                                <span className="text-destructive font-medium">€{daPagare.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {saldato ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Saldato</Badge>
                                            ) : pagato > 0 ? (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Parziale</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Da Pagare</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
                {documenti.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        <ReceiptText className="h-8 w-8 mx-auto mb-3 opacity-20" />
                        <p>Nessun documento creato.</p>
                    </div>
                )}
            </Card>
        </div>
    )
}
