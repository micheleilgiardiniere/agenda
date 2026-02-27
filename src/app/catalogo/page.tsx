'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Pencil, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { getCatalogo, insertCatalogo, updateCatalogo } from '@/lib/supabase/queries'
import type { CatalogoItem } from '@/types/database'

export default function CatalogoPage() {
    const [items, setItems] = useState<CatalogoItem[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'tutti' | 'servizio' | 'materiale'>('tutti')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ nome: '', tipo: 'materiale', unita_misura: 'pz', prezzo_listino: '', note: '' })

    useEffect(() => { loadData() }, [])
    const loadData = async () => { try { setItems(await getCatalogo()) } catch { toast.error('Errore caricamento') } finally { setLoading(false) } }
    const resetForm = () => { setForm({ nome: '', tipo: 'materiale', unita_misura: 'pz', prezzo_listino: '', note: '' }); setEditingId(null) }

    const openEdit = (c: CatalogoItem) => {
        setForm({ nome: c.nome, tipo: c.tipo, unita_misura: c.unita_misura, prezzo_listino: String(c.prezzo_listino), note: c.note || '' })
        setEditingId(c.id); setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.nome.trim()) return toast.error('Nome obbligatorio')
        setSaving(true)
        try {
            const payload = { nome: form.nome, tipo: form.tipo, unita_misura: form.unita_misura, prezzo_listino: parseFloat(form.prezzo_listino) || 0, note: form.note || null }
            if (editingId) { await updateCatalogo(editingId, payload); toast.success('Aggiornato') }
            else { await insertCatalogo(payload); toast.success('Aggiunto al catalogo') }
            setDialogOpen(false); resetForm(); await loadData()
        } catch { toast.error('Errore salvataggio') }
        finally { setSaving(false) }
    }

    const filtered = items.filter(c => (filter === 'tutti' || c.tipo === filter) && c.nome.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Catalogo</h1>
                <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild><Button size="lg" className="touch-target gap-2 rounded-xl font-semibold"><Plus className="h-5 w-5" /> Nuovo</Button></DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader><DialogTitle>{editingId ? 'Modifica' : 'Nuova Voce'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="flex gap-2">
                                <button onClick={() => setForm(f => ({ ...f, tipo: 'materiale' }))} className={cn('flex-1 p-3 rounded-xl border text-sm font-medium', form.tipo === 'materiale' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground')}>📦 Materiale</button>
                                <button onClick={() => setForm(f => ({ ...f, tipo: 'servizio' }))} className={cn('flex-1 p-3 rounded-xl border text-sm font-medium', form.tipo === 'servizio' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground')}>🔧 Servizio</button>
                            </div>
                            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="mt-1 touch-target" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Unità</Label><select value={form.unita_misura} onChange={e => setForm(f => ({ ...f, unita_misura: e.target.value }))} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">{['ore', 'pz', 'kg', 'lt', 'mq', 'ml', 'forfait'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                                <div><Label>Prezzo (€)</Label><Input value={form.prezzo_listino} onChange={e => setForm(f => ({ ...f, prezzo_listino: e.target.value }))} type="number" step="0.01" className="mt-1" /></div>
                            </div>
                            <Button onClick={handleSave} disabled={saving} className="w-full touch-target rounded-xl font-semibold">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salva' : 'Aggiungi'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex gap-2">
                {(['tutti', 'servizio', 'materiale'] as const).map(f => (
                    <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="rounded-lg capitalize">{f === 'tutti' ? 'Tutti' : f === 'servizio' ? '🔧 Servizi' : '📦 Materiali'}</Button>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 touch-target rounded-xl" />
            </div>

            <div className="space-y-2">
                {filtered.map(c => (
                    <Card key={c.id} className="shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="flex-1 min-w-0"><p className="font-medium">{c.nome}</p><p className="text-sm text-muted-foreground">€{c.prezzo_listino}/{c.unita_misura}</p></div>
                            <Badge variant="outline" className={cn('text-xs', c.tipo === 'servizio' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200')}>{c.tipo === 'servizio' ? '🔧' : '📦'} {c.tipo}</Badge>
                            <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nessun elemento</p>}
            </div>
        </div>
    )
}
