'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Calendar, Users, Package, Pencil, Trash2,
    Minus, Plus, Save, X, AlertTriangle, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getIntervento, getDipendenti, getCatalogo, updateInterventoDettagli, deleteIntervento } from '@/lib/supabase/queries'

// ─── Types ────────────────────────────────────────
type EditData = {
    data: string
    note: string
    stato_contabile: string
    manodopera: { dipendente_id: string; nome: string; ore: number; costo_orario: number }[]
    materiali: { catalogo_id: string; nome: string; quantita: number; prezzo: number; unita: string }[]
}

interface Props {
    interventoId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaved?: () => void
    onDeleted?: () => void
}

const statoConfig: Record<string, { label: string; color: string }> = {
    da_contabilizzare: { label: 'Da Contabilizzare', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    conto_finito: { label: 'Conto Finito', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    fatturato: { label: 'Fatturato', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    pagato: { label: 'Pagato', color: 'bg-green-100 text-green-700 border-green-200' },
}

export function InterventoDialog({ interventoId, open, onOpenChange, onSaved, onDeleted }: Props) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    const [raw, setRaw] = useState<any>(null)
    const [editData, setEditData] = useState<EditData | null>(null)
    const [allDipendenti, setAllDipendenti] = useState<any[]>([])
    const [allCatalogo, setAllCatalogo] = useState<any[]>([])

    // Per l'aggiunta di nuovi elementi durante l'editing
    const [newDip, setNewDip] = useState<string>('')
    const [newCat, setNewCat] = useState<string>('')

    useEffect(() => {
        if (open && interventoId) {
            loadData()
        } else {
            setRaw(null)
            setEditData(null)
            setEditing(false)
            setConfirmDelete(false)
            setNewDip('')
            setNewCat('')
        }
    }, [open, interventoId])

    async function loadData() {
        setLoading(true)
        try {
            const [inv, dips, cats] = await Promise.all([
                getIntervento(interventoId!),
                getDipendenti(),
                getCatalogo()
            ])
            setRaw(inv)
            setAllDipendenti(dips)
            setAllCatalogo(cats)

            setEditData({
                data: inv.data,
                note: inv.note || '',
                stato_contabile: inv.stato_contabile,
                manodopera: (inv.interventi_manodopera || []).map((m: any) => ({
                    dipendente_id: m.dipendente_id,
                    nome: `${m.dipendenti?.nome} ${m.dipendenti?.cognome}`.trim(),
                    ore: Number(m.ore),
                    costo_orario: Number(m.costo_orario)
                })),
                materiali: (inv.interventi_materiali || []).map((m: any) => ({
                    catalogo_id: m.catalogo_id,
                    nome: m.catalogo?.nome,
                    quantita: Number(m.quantita),
                    prezzo: Number(m.prezzo_applicato),
                    unita: m.catalogo?.unita_misura
                }))
            })
        } catch (err) {
            toast.error('Errore caricamento dettagli')
            onOpenChange(false)
        } finally {
            setLoading(false)
        }
    }

    if (!open || !interventoId) return null

    const handleSave = async () => {
        if (!editData) return
        setSaving(true)
        try {
            await updateInterventoDettagli(interventoId, editData)
            toast.success('Intervento aggiornato')
            setEditing(false)
            await loadData() // Ricarica dati freschi
            if (onSaved) onSaved()
        } catch (err) {
            toast.error('Errore durante il salvataggio')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteIntervento(interventoId)
            toast.success('Intervento eliminato')
            onOpenChange(false)
            if (onDeleted) onDeleted()
        } catch {
            toast.error('Errore eliminazione')
        }
    }

    const addDipendente = (id: string) => {
        if (!id || !editData) return
        if (editData.manodopera.some(m => m.dipendente_id === id)) {
            toast.error('Dipendente già presente')
            return
        }
        const d = allDipendenti.find(x => x.id === id)
        if (d) {
            setEditData({
                ...editData,
                manodopera: [...editData.manodopera, { dipendente_id: d.id, nome: `${d.nome} ${d.cognome}`, ore: 1, costo_orario: d.costo_orario }]
            })
        }
        setNewDip('')
    }

    const addMateriale = (id: string) => {
        if (!id || !editData) return
        if (editData.materiali.some(m => m.catalogo_id === id)) {
            toast.error('Articolo già presente')
            return
        }
        const c = allCatalogo.find(x => x.id === id)
        if (c) {
            setEditData({
                ...editData,
                materiali: [...editData.materiali, { catalogo_id: c.id, nome: c.nome, quantita: 1, prezzo: c.prezzo_listino, unita: c.unita_misura }]
            })
        }
        setNewCat('')
    }

    const current = editing ? editData : editData

    if (loading || !raw || !current) return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Caricamento dettagli...</p>
            </DialogContent>
        </Dialog>
    )

    const totManodopera = current.manodopera.reduce((s, d) => s + d.ore * d.costo_orario, 0)
    const totMateriali = current.materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0)
    const totale = totManodopera + totMateriali
    const stato = statoConfig[current.stato_contabile]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg">Dettaglio Intervento</DialogTitle>
                        <div className="flex items-center gap-1">
                            {!editing && (
                                <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 px-2 text-muted-foreground">
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                            {!confirmDelete ? (
                                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="h-8 px-2 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="flex items-center gap-1 bg-destructive/10 rounded-lg px-2 py-1">
                                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                    <span className="text-xs text-destructive font-medium">Sicuro?</span>
                                    <Button variant="destructive" size="sm" onClick={handleDelete} className="h-6 px-2 text-xs">Sì</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="h-6 px-2 text-xs">No</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 pt-1">
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-semibold">{raw.progetti?.nome}</p>
                            <p className="text-sm text-muted-foreground">{raw.progetti?.clienti?.nome}</p>
                        </div>
                        <div className="text-right space-y-2">
                            {editing ? (
                                <Select value={editData!.stato_contabile} onValueChange={v => setEditData({ ...editData!, stato_contabile: v })}>
                                    <SelectTrigger className="h-8 text-xs w-36">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statoConfig).map(([k, v]) => (
                                            <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge variant="outline" className={cn('text-xs flex ml-auto', stato?.color)}>{stato?.label}</Badge>
                            )}

                            {editing ? (
                                <Input type="date" value={editData!.data} onChange={e => setEditData({ ...editData!, data: e.target.value })} className="h-8 text-xs w-36 ml-auto" />
                            ) : (
                                <p className="text-sm text-muted-foreground flex items-center justify-end gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(current.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    {editing ? (
                        <div><Label className="text-xs">Note</Label><Textarea value={editData!.note} onChange={e => setEditData({ ...editData!, note: e.target.value })} className="mt-1 text-sm min-h-[60px]" placeholder="Aggiungi una nota..." /></div>
                    ) : current.note ? (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{current.note}</p>
                    ) : null}

                    {/* Workers */}
                    <Card className="border-border/50">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted-foreground">
                                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> MANODOPERA</span>
                            </div>

                            {current.manodopera.map((d, i) => (
                                <div key={d.dipendente_id} className="flex items-center justify-between py-1.5 text-sm group">
                                    <span className="font-medium flex items-center gap-2">
                                        {editing && (
                                            <button onClick={() => {
                                                const m = [...editData!.manodopera]; m.splice(i, 1); setEditData({ ...editData!, manodopera: m })
                                            }} className="h-5 w-5 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                        {d.nome}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {editing ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => {
                                                    const m = [...editData!.manodopera]; m[i] = { ...m[i], ore: Math.max(0.5, m[i].ore - 0.5) }; setEditData({ ...editData!, manodopera: m })
                                                }} className="h-7 w-7 rounded bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                <span className="w-10 text-center font-bold tabular-nums text-xs">{d.ore}h</span>
                                                <button onClick={() => {
                                                    const m = [...editData!.manodopera]; m[i] = { ...m[i], ore: m[i].ore + 0.5 }; setEditData({ ...editData!, manodopera: m })
                                                }} className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground tabular-nums">{d.ore}h × €{d.costo_orario}</span>
                                        )}
                                        <span className="font-semibold tabular-nums w-12 text-right">€{(d.ore * d.costo_orario).toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}

                            {editing && (
                                <div className="mt-3 pt-3 border-t">
                                    <Select value={newDip} onValueChange={addDipendente}>
                                        <SelectTrigger className="h-8 text-xs bg-muted/30">
                                            <SelectValue placeholder="Aggiungi dipendente..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allDipendenti.filter(d => !editData!.manodopera.some(m => m.dipendente_id === d.id)).map(d => (
                                                <SelectItem key={d.id} value={d.id} className="text-xs">{d.nome} {d.cognome} — €{d.costo_orario}/h</SelectItem>
                                            ))}
                                            {allDipendenti.filter(d => !editData!.manodopera.some(m => m.dipendente_id === d.id)).length === 0 && (
                                                <div className="p-2 text-xs text-muted-foreground text-center">Tutti i dipendenti aggiunti</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="border-t mt-3 pt-2 flex justify-between text-sm font-semibold">
                                <span>Subtotale</span><span className="tabular-nums">€{totManodopera.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Materials */}
                    {(current.materiali.length > 0 || editing) && (
                        <Card className="border-border/50">
                            <CardContent className="p-3">
                                <div className="flex items-center justify-between mb-3 text-xs font-semibold text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5 text-primary" /> MATERIALI / SERVIZI</span>
                                </div>

                                {current.materiali.map((m, i) => (
                                    <div key={m.catalogo_id} className="flex items-center justify-between py-1.5 text-sm group">
                                        <span className="font-medium flex items-center gap-2 truncate flex-1 mr-2">
                                            {editing && (
                                                <button onClick={() => {
                                                    const mats = [...editData!.materiali]; mats.splice(i, 1); setEditData({ ...editData!, materiali: mats })
                                                }} className="h-5 w-5 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                            {m.nome}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {editing ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => {
                                                        const mats = [...editData!.materiali]; mats[i] = { ...mats[i], quantita: Math.max(0.5, mats[i].quantita - 0.5) }; setEditData({ ...editData!, materiali: mats })
                                                    }} className="h-7 w-7 rounded bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-8 text-center font-bold tabular-nums text-xs">{m.quantita}</span>
                                                    <button onClick={() => {
                                                        const mats = [...editData!.materiali]; mats[i] = { ...mats[i], quantita: mats[i].quantita + 0.5 }; setEditData({ ...editData!, materiali: mats })
                                                    }} className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground tabular-nums">{m.quantita} {m.unita} × €{m.prezzo.toFixed(2)}</span>
                                            )}
                                            <span className="font-semibold tabular-nums w-12 text-right">€{(m.quantita * m.prezzo).toFixed(0)}</span>
                                        </div>
                                    </div>
                                ))}

                                {editing && (
                                    <div className="mt-3 pt-3 border-t">
                                        <Select value={newCat} onValueChange={addMateriale}>
                                            <SelectTrigger className="h-8 text-xs bg-muted/30">
                                                <SelectValue placeholder="Aggiungi prodotto/servizio..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {allCatalogo.map(c => (
                                                    <SelectItem key={c.id} value={c.id} className="text-xs">{c.nome} — €{c.prezzo_listino}/{c.unita_misura}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="border-t mt-3 pt-2 flex justify-between text-sm font-semibold">
                                    <span>Subtotale</span><span className="tabular-nums">€{totMateriali.toFixed(2)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <span className="font-bold">Totale</span>
                        <span className="text-xl font-bold text-primary tabular-nums">€{totale.toFixed(2)}</span>
                    </div>

                    {/* Save / Cancel when editing */}
                    {editing && (
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => { setEditing(false); loadData(); }} className="flex-1" disabled={saving}>Annulla</Button>
                            <Button onClick={handleSave} className="flex-1 gap-2" disabled={saving}>
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salva
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
