'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getDipendenti, insertDipendente, updateDipendente } from '@/lib/supabase/queries'
import type { Dipendente } from '@/types/database'

export default function DipendentiPage() {
    const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ nome: '', cognome: '', telefono: '', costo_orario: '' })

    useEffect(() => { loadData() }, [])
    const loadData = async () => { try { setDipendenti(await getDipendenti()) } catch { toast.error('Errore caricamento') } finally { setLoading(false) } }
    const resetForm = () => { setForm({ nome: '', cognome: '', telefono: '', costo_orario: '' }); setEditingId(null) }

    const openEdit = (d: Dipendente) => {
        setForm({ nome: d.nome, cognome: d.cognome, telefono: d.telefono || '', costo_orario: String(d.costo_orario) })
        setEditingId(d.id); setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.nome.trim() || !form.cognome.trim()) return toast.error('Nome e cognome obbligatori')
        setSaving(true)
        try {
            const payload = { nome: form.nome, cognome: form.cognome, telefono: form.telefono || null, costo_orario: parseFloat(form.costo_orario) || 0 }
            if (editingId) { await updateDipendente(editingId, payload); toast.success('Dipendente aggiornato') }
            else { await insertDipendente(payload); toast.success('Dipendente aggiunto') }
            setDialogOpen(false); resetForm(); await loadData()
        } catch { toast.error('Errore salvataggio') }
        finally { setSaving(false) }
    }

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dipendenti</h1>
                <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild><Button size="lg" className="touch-target gap-2 rounded-xl font-semibold"><Plus className="h-5 w-5" /> Nuovo</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>{editingId ? 'Modifica Dipendente' : 'Nuovo Dipendente'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="mt-1 touch-target" /></div>
                                <div><Label>Cognome *</Label><Input value={form.cognome} onChange={e => setForm(f => ({ ...f, cognome: e.target.value }))} className="mt-1 touch-target" /></div>
                            </div>
                            <div><Label>Telefono</Label><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} type="tel" className="mt-1" /></div>
                            <div><Label>Costo Orario (€)</Label><Input value={form.costo_orario} onChange={e => setForm(f => ({ ...f, costo_orario: e.target.value }))} type="number" step="0.5" className="mt-1" /></div>
                            <Button onClick={handleSave} disabled={saving} className="w-full touch-target rounded-xl font-semibold">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salva' : 'Aggiungi'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="space-y-2">
                {dipendenti.map(d => (
                    <Card key={d.id} className="shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{d.nome[0]}{d.cognome[0]}</div>
                            <div className="flex-1 min-w-0"><p className="font-medium">{d.nome} {d.cognome}</p><p className="text-sm text-muted-foreground">€{d.costo_orario}/h{d.telefono ? ` • ${d.telefono}` : ''}</p></div>
                            <button onClick={() => openEdit(d)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                        </CardContent>
                    </Card>
                ))}
                {dipendenti.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun dipendente. Aggiungine uno!</p>}
            </div>
        </div>
    )
}
