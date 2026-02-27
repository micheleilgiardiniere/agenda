'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getTodos, insertTodo, updateTodo, deleteTodo } from '@/lib/supabase/queries'
import type { Priorita } from '@/types/database'

const priorityColors: Record<Priorita, string> = {
    urgente: 'bg-red-100 text-red-700 border-red-200',
    alta: 'bg-orange-100 text-orange-700 border-orange-200',
    media: 'bg-blue-100 text-blue-700 border-blue-200',
    bassa: 'bg-zinc-100 text-zinc-600 border-zinc-200',
}

export default function TodoPage() {
    const [todos, setTodos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ titolo: '', descrizione: '', priorita: 'media' as Priorita, data_scadenza: '' })

    useEffect(() => { loadData() }, [])
    const loadData = async () => { try { setTodos(await getTodos()) } catch { toast.error('Errore caricamento') } finally { setLoading(false) } }

    const resetForm = () => {
        setForm({ titolo: '', descrizione: '', priorita: 'media', data_scadenza: '' })
        setEditingId(null)
    }

    const openEdit = (t: any) => {
        setForm({
            titolo: t.titolo,
            descrizione: t.descrizione || '',
            priorita: t.priorita,
            data_scadenza: t.data_scadenza || ''
        })
        setEditingId(t.id)
        setDialogOpen(true)
    }

    const toggle = async (id: string, current: boolean) => {
        try { await updateTodo(id, { completato: !current }); setTodos(prev => prev.map(t => t.id === id ? { ...t, completato: !current } : t)) }
        catch { toast.error('Errore aggiornamento') }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteTodo(id)
            setTodos(prev => prev.filter(t => t.id !== id))
            toast.success('Attività eliminata')
        } catch {
            toast.error('Errore eliminazione')
        }
    }

    const handleSave = async () => {
        if (!form.titolo.trim()) return toast.error('Titolo obbligatorio')
        setSaving(true)
        try {
            const payload = { titolo: form.titolo, descrizione: form.descrizione || null, priorita: form.priorita, data_scadenza: form.data_scadenza || null }
            if (editingId) {
                await updateTodo(editingId, payload)
                toast.success('Attività aggiornata')
            } else {
                await insertTodo(payload)
                toast.success('Attività aggiunta')
            }
            setDialogOpen(false)
            resetForm()
            await loadData()
        } catch { toast.error('Errore salvataggio') }
        finally { setSaving(false) }
    }

    const active = todos.filter(t => !t.completato).sort((a, b) => { const o: Priorita[] = ['urgente', 'alta', 'media', 'bassa']; return o.indexOf(a.priorita) - o.indexOf(b.priorita) })
    const done = todos.filter(t => t.completato)

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Lavori Futuri</h1>
                <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild><Button size="lg" className="touch-target gap-2 rounded-xl font-semibold"><Plus className="h-5 w-5" /> Nuovo</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>{editingId ? 'Modifica Attività' : 'Nuova Attività'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div><Label>Titolo *</Label><Input value={form.titolo} onChange={e => setForm(f => ({ ...f, titolo: e.target.value }))} className="mt-1 touch-target" /></div>
                            <div><Label>Descrizione</Label><Textarea value={form.descrizione} onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))} className="mt-1" /></div>
                            <div><Label>Priorità</Label><div className="grid grid-cols-4 gap-2 mt-1">{(['bassa', 'media', 'alta', 'urgente'] as Priorita[]).map(p => (<button key={p} onClick={() => setForm(f => ({ ...f, priorita: p }))} className={cn('p-2 rounded-lg border text-xs font-medium capitalize', form.priorita === p ? priorityColors[p] : 'border-border/30 text-muted-foreground')}>{p}</button>))}</div></div>
                            <div><Label>Scadenza</Label><Input type="date" value={form.data_scadenza} onChange={e => setForm(f => ({ ...f, data_scadenza: e.target.value }))} className="mt-1" /></div>
                            <Button onClick={handleSave} disabled={saving} className="w-full touch-target rounded-xl font-semibold">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salva' : 'Aggiungi'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-2">
                {active.map(t => (
                    <Card key={t.id} className="shadow-sm">
                        <CardContent className="p-3 flex items-start gap-3">
                            <button onClick={() => toggle(t.id, t.completato)} className="touch-target flex items-center justify-center shrink-0 mt-0.5"><Circle className="h-5 w-5 text-muted-foreground" /></button>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium cursor-pointer hover:text-primary transition-colors pr-2" onClick={() => openEdit(t)}>{t.titolo}</p>
                                {t.descrizione && <p className="text-xs text-muted-foreground mt-0.5">{t.descrizione}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className={cn('text-[10px] capitalize', priorityColors[t.priorita as Priorita])}>{t.priorita}</Badge>
                                    {t.data_scadenza && <span className="text-[10px] text-muted-foreground">📅 {new Date(t.data_scadenza).toLocaleDateString('it-IT')}</span>}
                                </div>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(t.id)} className="p-2 text-muted-foreground hover:text-destructive shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {done.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Completati ({done.length})</p>
                    <div className="space-y-1">
                        {done.map(t => (
                            <Card key={t.id} className="shadow-sm opacity-60">
                                <CardContent className="p-3 flex items-center gap-3 group">
                                    <button onClick={() => toggle(t.id, t.completato)} className="shrink-0"><CheckCircle2 className="h-5 w-5 text-primary" /></button>
                                    <p className="text-sm line-through flex-1 truncate">{t.titolo}</p>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            {active.length === 0 && done.length === 0 && <p className="text-center text-muted-foreground py-8">Nessuna attività</p>}
        </div>
    )
}
