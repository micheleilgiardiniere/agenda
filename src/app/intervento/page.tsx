'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
    ChevronLeft, Search, Minus, Plus, CheckCircle2, UserPlus, FolderPlus,
    PackagePlus, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { getClienti, getDipendenti, getCatalogo, getProgetti, insertCliente, insertProgetto, insertCatalogo, insertIntervento } from '@/lib/supabase/queries'
import type { Cliente, Dipendente, CatalogoItem } from '@/types/database'

const STEPS = [
    { label: 'Cantiere', icon: '📋' },
    { label: 'Squadra', icon: '👷' },
    { label: 'Materiali', icon: '📦' },
    { label: 'Riepilogo', icon: '✓' },
]

export default function InterventoPage() {
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // DB data
    const [clienti, setClienti] = useState<Cliente[]>([])
    const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
    const [catalogoItems, setCatalogo] = useState<CatalogoItem[]>([])
    const [progetti, setProgetti] = useState<any[]>([])

    // Form state
    const [data, setData] = useState(new Date().toISOString().slice(0, 10))
    const [progettoId, setProgettoId] = useState('')
    const [note, setNote] = useState('')
    const [searchProg, setSearchProg] = useState('')
    const [squadra, setSquadra] = useState<Record<string, number>>({})
    const [materiali, setMateriali] = useState<{ catalogo_id: string; quantita: number; prezzo: number }[]>([])
    const [searchMat, setSearchMat] = useState('')

    // Inline creation dialogs
    const [showNewClient, setShowNewClient] = useState(false)
    const [showNewProject, setShowNewProject] = useState(false)
    const [showNewCatItem, setShowNewCatItem] = useState(false)
    const [newClientNome, setNewClientNome] = useState('')
    const [newClientTel, setNewClientTel] = useState('')
    const [newProjNome, setNewProjNome] = useState('')
    const [newProjClientId, setNewProjClientId] = useState('')
    const [newProjTipo, setNewProjTipo] = useState('economia')
    const [newCatNome, setNewCatNome] = useState('')
    const [newCatTipo, setNewCatTipo] = useState('materiale')
    const [newCatPrezzo, setNewCatPrezzo] = useState('')
    const [newCatUnita, setNewCatUnita] = useState('pz')
    const [dialogSaving, setDialogSaving] = useState(false)

    const loadData = useCallback(async () => {
        try {
            const [c, d, cat, p] = await Promise.all([getClienti(), getDipendenti(), getCatalogo(), getProgetti()])
            setClienti(c); setDipendenti(d); setCatalogo(cat); setProgetti(p)
        } catch { toast.error('Errore caricamento dati') }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const progettoSel = progetti.find(p => p.id === progettoId)

    const filteredProg = progetti.filter(p =>
        p.nome.toLowerCase().includes(searchProg.toLowerCase()) ||
        p.clienti?.nome?.toLowerCase().includes(searchProg.toLowerCase())
    )

    const filteredCat = catalogoItems.filter(c => c.nome.toLowerCase().includes(searchMat.toLowerCase()))

    const toggleDip = (id: string) => setSquadra(prev => {
        const next = { ...prev }
        if (next[id] !== undefined) delete next[id]; else next[id] = 8
        return next
    })

    const setOre = (id: string, delta: number) => setSquadra(prev => ({ ...prev, [id]: Math.max(0.5, (prev[id] || 8) + delta) }))

    const addMat = (item: CatalogoItem) => {
        if (materiali.some(m => m.catalogo_id === item.id)) return
        setMateriali(prev => [...prev, { catalogo_id: item.id, quantita: 1, prezzo: Number(item.prezzo_listino) }])
    }

    const setMatQty = (idx: number, delta: number) => setMateriali(prev => prev.map((m, i) => i === idx ? { ...m, quantita: Math.max(0.5, m.quantita + delta) } : m))

    const removeMat = (idx: number) => setMateriali(prev => prev.filter((_, i) => i !== idx))

    const totManodopera = Object.entries(squadra).reduce((s, [id, ore]) => {
        const d = dipendenti.find(d => d.id === id)
        return s + ore * (d ? Number(d.costo_orario) : 0)
    }, 0)

    const totMateriali = materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0)

    // ─── Inline creation handlers ───────────────────────
    const handleNewClient = async () => {
        if (!newClientNome.trim()) return toast.error('Nome obbligatorio')
        setDialogSaving(true)
        try {
            const c = await insertCliente({ nome: newClientNome, tipo: 'privato', telefono: newClientTel || null })
            setClienti(prev => [...prev, c])
            setShowNewClient(false); setNewClientNome(''); setNewClientTel('')
            setNewProjClientId(c.id); setShowNewProject(true)
            toast.success('Cliente creato')
        } catch { toast.error('Errore creazione') }
        finally { setDialogSaving(false) }
    }

    const handleNewProject = async () => {
        if (!newProjNome.trim() || !newProjClientId) return toast.error('Nome e cliente obbligatori')
        setDialogSaving(true)
        try {
            const p = await insertProgetto({ nome: newProjNome, cliente_id: newProjClientId, tipologia: newProjTipo })
            await loadData()
            setProgettoId(p.id); setShowNewProject(false); setNewProjNome(''); setNewProjTipo('economia')
            toast.success('Progetto creato e selezionato')
        } catch { toast.error('Errore creazione') }
        finally { setDialogSaving(false) }
    }

    const handleNewCatItem = async () => {
        if (!newCatNome.trim()) return toast.error('Nome obbligatorio')
        setDialogSaving(true)
        try {
            const c = await insertCatalogo({ nome: newCatNome, tipo: newCatTipo, unita_misura: newCatUnita, prezzo_listino: parseFloat(newCatPrezzo) || 0 })
            setCatalogo(prev => [...prev, c])
            addMat(c); setShowNewCatItem(false); setNewCatNome(''); setNewCatPrezzo('')
            toast.success('Voce creata e aggiunta')
        } catch { toast.error('Errore creazione') }
        finally { setDialogSaving(false) }
    }

    // ─── Submit ─────────────────────────────────────────
    const handleSubmit = async () => {
        setSaving(true)
        try {
            await insertIntervento({
                data,
                progetto_id: progettoId,
                note,
                manodopera: Object.entries(squadra).map(([id, ore]) => {
                    const d = dipendenti.find(d => d.id === id)
                    return { dipendente_id: id, ore, costo_orario: d ? Number(d.costo_orario) : 0 }
                }),
                materiali: materiali.map(m => ({ catalogo_id: m.catalogo_id, quantita: m.quantita, prezzo_applicato: m.prezzo })),
            })
            toast.success('Intervento salvato!')
            // Reset
            setStep(0); setProgettoId(''); setNote(''); setSquadra({}); setMateriali([])
            setData(new Date().toISOString().slice(0, 10))
        } catch (e) { toast.error('Errore salvataggio') }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link href="/"><button className="touch-target flex items-center justify-center rounded-lg hover:bg-muted"><ChevronLeft className="h-6 w-6" /></button></Link>
                <h1 className="text-xl font-bold">Scheda Unica</h1>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-6">
                {STEPS.map((s, i) => (
                    <button key={i} onClick={() => { if (i < step) setStep(i) }} disabled={i > step} className={cn('flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition-all', i === step ? 'bg-primary/10 text-primary' : i < step ? 'text-primary/60 cursor-pointer' : 'text-muted-foreground')}>
                        <div className={cn('h-1 w-full rounded-full mb-1', i <= step ? 'bg-primary' : 'bg-border')} />
                        <span>{s.icon} {s.label}</span>
                    </button>
                ))}
            </div>

            {/* ─── STEP 0: Cantiere ────────────────────────── */}
            {step === 0 && (
                <div className="space-y-4">
                    <div><Label className="text-muted-foreground">Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} className="mt-1 touch-target rounded-xl" /></div>

                    <div className="flex items-center justify-between">
                        <Label className="text-muted-foreground">Cantiere / Progetto</Label>
                        <div className="flex gap-2">
                            <button onClick={() => setShowNewClient(true)} className="text-xs text-primary flex items-center gap-1"><UserPlus className="h-3.5 w-3.5" /> Nuovo Cliente</button>
                            <button onClick={() => { setNewProjClientId(''); setShowNewProject(true) }} className="text-xs text-primary flex items-center gap-1"><FolderPlus className="h-3.5 w-3.5" /> Nuovo Progetto</button>
                        </div>
                    </div>

                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Cerca cliente o cantiere..." value={searchProg} onChange={e => setSearchProg(e.target.value)} className="pl-10 touch-target rounded-xl" /></div>

                    <div className="space-y-1.5">
                        {filteredProg.map(p => (
                            <Card key={p.id} onClick={() => setProgettoId(p.id)} className={cn('shadow-sm cursor-pointer transition-all', progettoId === p.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md')}>
                                <CardContent className="p-3 flex items-center justify-between">
                                    <div><p className="font-medium">{p.nome}</p><p className="text-xs text-muted-foreground">{p.clienti?.nome || '—'}</p></div>
                                    <Badge variant="outline" className={cn('text-[10px]', p.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200')}>{p.tipologia === 'preventivo' ? '🔵 Prev.' : '🟢 Econ.'}</Badge>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredProg.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nessun progetto trovato</p>}
                    </div>

                    <details className="text-sm"><summary className="text-muted-foreground cursor-pointer">+ Aggiungi note</summary><Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Note intervento..." className="mt-2" /></details>

                    <Button size="lg" className="w-full touch-target rounded-xl font-semibold" disabled={!progettoId} onClick={() => setStep(1)}>Avanti →</Button>
                </div>
            )}

            {/* ─── STEP 1: Squadra ─────────────────────────── */}
            {step === 1 && (
                <div className="space-y-3">
                    {dipendenti.map(d => {
                        const active = squadra[d.id] !== undefined
                        return (
                            <Card key={d.id} onClick={() => toggleDip(d.id)} className={cn('shadow-sm cursor-pointer transition-all', active ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md')}>
                                <CardContent className="p-3 flex items-center gap-3">
                                    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0', active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>{d.nome[0]}{d.cognome[0]}</div>
                                    <div className="flex-1"><p className="font-medium">{d.nome} {d.cognome}</p><p className="text-xs text-muted-foreground">€{d.costo_orario}/h</p></div>
                                    {active && (
                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setOre(d.id, -0.5)} className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                            <span className="w-10 text-center font-bold text-sm">{squadra[d.id]}h</span>
                                            <button onClick={() => setOre(d.id, 0.5)} className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                    {dipendenti.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aggiungi dipendenti dalla sezione Dipendenti</p>}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setStep(0)} className="flex-1 touch-target rounded-xl">← Indietro</Button>
                        <Button onClick={() => setStep(2)} className="flex-1 touch-target rounded-xl font-semibold" disabled={Object.keys(squadra).length === 0}>Avanti →</Button>
                    </div>
                </div>
            )}

            {/* ─── STEP 2: Materiali ───────────────────────── */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Cerca nel catalogo..." value={searchMat} onChange={e => setSearchMat(e.target.value)} className="pl-10 touch-target rounded-xl" /></div>

                    <div className="flex flex-wrap gap-1.5">
                        {filteredCat.map(c => {
                            const added = materiali.some(m => m.catalogo_id === c.id)
                            return <button key={c.id} onClick={() => addMat(c)} disabled={added} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', added ? 'bg-primary/10 text-primary border-primary/20' : 'border-border text-muted-foreground hover:text-foreground')}>{c.nome}</button>
                        })}
                        <button onClick={() => { setNewCatNome(searchMat); setShowNewCatItem(true) }} className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed text-primary hover:bg-primary/5"><PackagePlus className="h-3 w-3 inline mr-1" />Nuova voce</button>
                    </div>

                    {materiali.length > 0 && (
                        <div className="space-y-2 pt-2">
                            {materiali.map((m, i) => {
                                const cat = catalogoItems.find(c => c.id === m.catalogo_id)
                                return (
                                    <Card key={i} className="shadow-sm">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{cat?.nome}</p><p className="text-xs text-muted-foreground">€{m.prezzo}/{cat?.unita_misura}</p></div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setMatQty(i, -0.5)} className="h-7 w-7 rounded bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                <span className="w-8 text-center font-bold text-xs">{m.quantita}</span>
                                                <button onClick={() => setMatQty(i, 0.5)} className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                            </div>
                                            <button onClick={() => removeMat(i)} className="text-xs text-destructive">✕</button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 touch-target rounded-xl">← Indietro</Button>
                        <Button onClick={() => setStep(3)} className="flex-1 touch-target rounded-xl font-semibold">Riepilogo →</Button>
                    </div>
                </div>
            )}

            {/* ─── STEP 3: Riepilogo ────────────────────────── */}
            {step === 3 && (
                <div className="space-y-4">
                    <Card className="shadow-sm"><CardContent className="p-4">
                        <p className="font-bold">{progettoSel?.nome}</p>
                        <p className="text-sm text-muted-foreground">{progettoSel?.clienti?.nome} • {new Date(data).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        {note && <p className="text-sm mt-2 p-2 bg-muted/50 rounded-lg">{note}</p>}
                    </CardContent></Card>

                    <Card className="shadow-sm"><CardContent className="p-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">👷 MANODOPERA</p>
                        {Object.entries(squadra).map(([id, ore]) => {
                            const d = dipendenti.find(d => d.id === id)
                            if (!d) return null
                            return <div key={id} className="flex justify-between py-1 text-sm"><span>{d.nome} {d.cognome}</span><span className="tabular-nums">{ore}h × €{d.costo_orario} = <b>€{(ore * Number(d.costo_orario)).toFixed(0)}</b></span></div>
                        })}
                        <div className="border-t mt-2 pt-2 flex justify-between text-sm font-semibold"><span>Subtotale</span><span>€{totManodopera.toFixed(2)}</span></div>
                    </CardContent></Card>

                    {materiali.length > 0 && (
                        <Card className="shadow-sm"><CardContent className="p-4">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">📦 MATERIALI</p>
                            {materiali.map((m, i) => {
                                const cat = catalogoItems.find(c => c.id === m.catalogo_id)
                                return <div key={i} className="flex justify-between py-1 text-sm"><span>{cat?.nome}</span><span className="tabular-nums">{m.quantita} × €{m.prezzo} = <b>€{(m.quantita * m.prezzo).toFixed(2)}</b></span></div>
                            })}
                            <div className="border-t mt-2 pt-2 flex justify-between text-sm font-semibold"><span>Subtotale</span><span>€{totMateriali.toFixed(2)}</span></div>
                        </CardContent></Card>
                    )}

                    <div className="flex justify-between items-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="font-bold text-lg">Totale</span>
                        <span className="text-2xl font-bold text-primary tabular-nums">€{(totManodopera + totMateriali).toFixed(2)}</span>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setStep(2)} className="flex-1 touch-target rounded-xl">← Modifica</Button>
                        <Button onClick={handleSubmit} disabled={saving} className="flex-1 touch-target rounded-xl font-semibold gap-2">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Salva
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── DIALOGS ──────────────────────────────────── */}
            <Dialog open={showNewClient} onOpenChange={setShowNewClient}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Nuovo Cliente</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div><Label>Nome *</Label><Input value={newClientNome} onChange={e => setNewClientNome(e.target.value)} className="mt-1" /></div>
                        <div><Label>Telefono</Label><Input value={newClientTel} onChange={e => setNewClientTel(e.target.value)} type="tel" className="mt-1" /></div>
                        <Button onClick={handleNewClient} disabled={dialogSaving} className="w-full touch-target rounded-xl font-semibold gap-2">{dialogSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Crea Cliente + Progetto</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Nuovo Progetto</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div><Label>Cliente</Label><select value={newProjClientId} onChange={e => setNewProjClientId(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">Seleziona...</option>{clienti.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                        <div><Label>Nome Progetto *</Label><Input value={newProjNome} onChange={e => setNewProjNome(e.target.value)} className="mt-1" /></div>
                        <div className="flex gap-2">
                            <button onClick={() => setNewProjTipo('economia')} className={cn('flex-1 p-2 rounded-lg border text-sm', newProjTipo === 'economia' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30')}>🟢 Economia</button>
                            <button onClick={() => setNewProjTipo('preventivo')} className={cn('flex-1 p-2 rounded-lg border text-sm', newProjTipo === 'preventivo' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-border/30')}>🔵 Preventivo</button>
                        </div>
                        <Button onClick={handleNewProject} disabled={dialogSaving} className="w-full touch-target rounded-xl font-semibold gap-2">{dialogSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}Crea Progetto</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showNewCatItem} onOpenChange={setShowNewCatItem}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Nuova voce catalogo</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="flex gap-2">
                            <button onClick={() => setNewCatTipo('materiale')} className={cn('flex-1 p-2 rounded-lg border text-sm', newCatTipo === 'materiale' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30')}>📦 Materiale</button>
                            <button onClick={() => setNewCatTipo('servizio')} className={cn('flex-1 p-2 rounded-lg border text-sm', newCatTipo === 'servizio' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30')}>🔧 Servizio</button>
                        </div>
                        <div><Label>Nome *</Label><Input value={newCatNome} onChange={e => setNewCatNome(e.target.value)} className="mt-1" /></div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><Label>Unità</Label><select value={newCatUnita} onChange={e => setNewCatUnita(e.target.value)} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">{['ore', 'pz', 'kg', 'lt', 'mq', 'ml', 'forfait'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                            <div><Label>Prezzo (€)</Label><Input value={newCatPrezzo} onChange={e => setNewCatPrezzo(e.target.value)} type="number" className="mt-1" /></div>
                        </div>
                        <Button onClick={handleNewCatItem} disabled={dialogSaving} className="w-full touch-target rounded-xl font-semibold gap-2">{dialogSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}Crea + Aggiungi</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
