'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Pencil, FolderKanban, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getProgetti, getClienti, insertProgetto, updateProgetto } from '@/lib/supabase/queries'
import { useRouter } from 'next/navigation'
import type { Cliente } from '@/types/database'

export default function ProgettiPage() {
    const router = useRouter()
    const [progetti, setProgetti] = useState<any[]>([])
    const [clienti, setClienti] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ nome: '', cliente_id: '', tipologia: 'economia', importo_preventivo: '', descrizione: '' })

    useEffect(() => { loadData() }, [])
    const loadData = async () => { try { const [p, c] = await Promise.all([getProgetti(), getClienti()]); setProgetti(p); setClienti(c) } catch { toast.error('Errore caricamento') } finally { setLoading(false) } }
    const resetForm = () => { setForm({ nome: '', cliente_id: '', tipologia: 'economia', importo_preventivo: '', descrizione: '' }); setEditingId(null) }

    const openEdit = (p: any) => {
        setForm({ nome: p.nome, cliente_id: p.cliente_id, tipologia: p.tipologia, importo_preventivo: p.importo_preventivo ? String(p.importo_preventivo) : '', descrizione: p.descrizione || '' })
        setEditingId(p.id); setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.nome.trim() || !form.cliente_id) return toast.error('Nome e cliente obbligatori')
        setSaving(true)
        try {
            const payload = { nome: form.nome, cliente_id: form.cliente_id, tipologia: form.tipologia, importo_preventivo: form.importo_preventivo ? parseFloat(form.importo_preventivo) : null, descrizione: form.descrizione || null }
            if (editingId) { await updateProgetto(editingId, payload); toast.success('Progetto aggiornato') }
            else { await insertProgetto(payload); toast.success('Progetto creato') }
            setDialogOpen(false); resetForm(); await loadData()
        } catch { toast.error('Errore salvataggio') }
        finally { setSaving(false) }
    }

    const filtered = progetti.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()) || p.clienti?.nome?.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Progetti</h1>
                <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild><Button size="lg" className="touch-target gap-2 rounded-xl font-semibold"><Plus className="h-5 w-5" /> Nuovo</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>{editingId ? 'Modifica Progetto' : 'Nuovo Progetto'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div><Label>Cliente *</Label><select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"><option value="">Seleziona...</option>{clienti.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
                            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="mt-1 touch-target" /></div>
                            <div className="flex gap-2">
                                <button onClick={() => setForm(f => ({ ...f, tipologia: 'economia' }))} className={cn('flex-1 p-3 rounded-xl border text-sm font-medium', form.tipologia === 'economia' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground')}>🟢 Economia</button>
                                <button onClick={() => setForm(f => ({ ...f, tipologia: 'preventivo' }))} className={cn('flex-1 p-3 rounded-xl border text-sm font-medium', form.tipologia === 'preventivo' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-border/30 text-muted-foreground')}>🔵 Preventivo</button>
                            </div>
                            {form.tipologia === 'preventivo' && <div><Label>Importo Preventivo (€)</Label><Input value={form.importo_preventivo} onChange={e => setForm(f => ({ ...f, importo_preventivo: e.target.value }))} type="number" className="mt-1" /></div>}
                            <Button onClick={handleSave} disabled={saving} className="w-full touch-target rounded-xl font-semibold">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salva' : 'Crea Progetto'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 touch-target rounded-xl" /></div>

            <div className="space-y-2">
                {filtered.map(p => (
                    <Card key={p.id} onClick={() => router.push(`/clienti/${p.cliente_id}?progetto=${p.id}`)} className="shadow-sm cursor-pointer hover:shadow-md transition-all group">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', p.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600')}>
                                <FolderKanban className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate group-hover:text-primary transition-colors">{p.nome}</p>
                                <p className="text-sm text-muted-foreground">{p.clienti?.nome || '—'}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <Badge variant="outline" className={cn('text-xs', p.tipologia === 'preventivo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200')}>{p.tipologia === 'preventivo' ? '🔵 Prev.' : '🟢 Econ.'}</Badge>
                                {p.importo_preventivo && <p className="text-sm font-bold mt-0.5">€{Number(p.importo_preventivo).toLocaleString()}</p>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); openEdit(p) }} className="p-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"><Pencil className="h-4 w-4" /></button>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun progetto</p>}
            </div>
        </div>
    )
}
