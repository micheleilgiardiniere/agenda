'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Calendar, Users, Package, Pencil, Trash2,
    Minus, Plus, Save, X, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────
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

interface Props {
    intervento: InterventoDettaglio | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave?: (intervento: InterventoDettaglio) => void
    onDelete?: (id: string) => void
}

const statoConfig = {
    da_contabilizzare: { label: 'Da Contabilizzare', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    conto_finito: { label: 'Conto Finito', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    fatturato: { label: 'Fatturato', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    pagato: { label: 'Pagato', color: 'bg-green-100 text-green-700 border-green-200' },
}

export function InterventoDialog({ intervento, open, onOpenChange, onSave, onDelete }: Props) {
    const [editing, setEditing] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [editData, setEditData] = useState<InterventoDettaglio | null>(null)

    React.useEffect(() => {
        if (intervento) {
            setEditData(JSON.parse(JSON.stringify(intervento)))
            setEditing(false)
            setConfirmDelete(false)
        }
    }, [intervento])

    if (!intervento || !editData) return null

    const current = editing ? editData : intervento
    const totManodopera = current.dipendenti.reduce((s, d) => s + d.ore * d.costo_orario, 0)
    const totMateriali = current.materiali.reduce((s, m) => s + m.quantita * m.prezzo, 0)
    const totale = totManodopera + totMateriali
    const stato = statoConfig[current.stato_contabile]

    const handleSave = () => {
        if (onSave && editData) onSave(editData)
        setEditing(false)
        toast.success('Intervento aggiornato')
    }

    const handleDelete = () => {
        if (onDelete) onDelete(intervento.id)
        onOpenChange(false)
        toast.success('Intervento eliminato')
    }

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
                            <p className="font-semibold">{current.progetto}</p>
                            <p className="text-sm text-muted-foreground">{current.cliente}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <Badge variant="outline" className={cn('text-xs', stato.color)}>{stato.label}</Badge>
                            {editing ? (
                                <Input type="date" value={editData.data} onChange={e => setEditData({ ...editData, data: e.target.value })} className="h-8 text-xs w-36" />
                            ) : (
                                <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(current.data).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    {editing ? (
                        <div><Label className="text-xs">Note</Label><Textarea value={editData.note} onChange={e => setEditData({ ...editData, note: e.target.value })} className="mt-1 text-sm min-h-[60px]" /></div>
                    ) : current.note ? (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{current.note}</p>
                    ) : null}

                    {/* Workers */}
                    <Card className="border-border/50">
                        <CardContent className="p-3">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                                <Users className="h-3.5 w-3.5 text-primary" /> MANODOPERA
                            </p>
                            {current.dipendenti.map((d, i) => (
                                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                                    <span className="font-medium">{d.nome}</span>
                                    <div className="flex items-center gap-2">
                                        {editing ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => {
                                                    const dips = [...editData.dipendenti]
                                                    dips[i] = { ...dips[i], ore: Math.max(0.5, dips[i].ore - 0.5) }
                                                    setEditData({ ...editData, dipendenti: dips })
                                                }} className="h-7 w-7 rounded bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                <span className="w-10 text-center font-bold tabular-nums text-xs">{d.ore}h</span>
                                                <button onClick={() => {
                                                    const dips = [...editData.dipendenti]
                                                    dips[i] = { ...dips[i], ore: dips[i].ore + 0.5 }
                                                    setEditData({ ...editData, dipendenti: dips })
                                                }} className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground tabular-nums">{d.ore}h × €{d.costo_orario}</span>
                                        )}
                                        <span className="font-semibold tabular-nums w-16 text-right">€{(d.ore * d.costo_orario).toFixed(0)}</span>
                                    </div>
                                </div>
                            ))}
                            <div className="border-t mt-2 pt-2 flex justify-between text-sm font-semibold">
                                <span>Subtotale</span><span className="tabular-nums">€{totManodopera.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Materials */}
                    {current.materiali.length > 0 && (
                        <Card className="border-border/50">
                            <CardContent className="p-3">
                                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                                    <Package className="h-3.5 w-3.5 text-primary" /> MATERIALI / SERVIZI
                                </p>
                                {current.materiali.map((m, i) => (
                                    <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                                        <span className="font-medium truncate flex-1 mr-2">{m.nome}</span>
                                        <div className="flex items-center gap-2">
                                            {editing ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => {
                                                        const mats = [...editData.materiali]
                                                        mats[i] = { ...mats[i], quantita: Math.max(0.5, mats[i].quantita - 0.5) }
                                                        setEditData({ ...editData, materiali: mats })
                                                    }} className="h-7 w-7 rounded bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                    <span className="w-8 text-center font-bold tabular-nums text-xs">{m.quantita}</span>
                                                    <button onClick={() => {
                                                        const mats = [...editData.materiali]
                                                        mats[i] = { ...mats[i], quantita: mats[i].quantita + 0.5 }
                                                        setEditData({ ...editData, materiali: mats })
                                                    }} className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground tabular-nums">{m.quantita} {m.unita} × €{m.prezzo.toFixed(2)}</span>
                                            )}
                                            <span className="font-semibold tabular-nums w-16 text-right">€{(m.quantita * m.prezzo).toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t mt-2 pt-2 flex justify-between text-sm font-semibold">
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
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setEditing(false); setEditData(JSON.parse(JSON.stringify(intervento))) }} className="flex-1">Annulla</Button>
                            <Button onClick={handleSave} className="flex-1 gap-2"><Save className="h-4 w-4" />Salva</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
