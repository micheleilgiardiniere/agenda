'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Phone, Mail, MapPin, User, Building2, Pencil, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { getClienti, insertCliente, updateCliente } from '@/lib/supabase/queries'
import type { Cliente } from '@/types/database'

export default function ClientiPage() {
    const [clienti, setClienti] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ nome: '', tipo: 'privato', referente: '', telefono: '', email: '', indirizzo: '', citta: '', cap: '', codice_fiscale: '', partita_iva: '', note: '' })

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try { const data = await getClienti(); setClienti(data) }
        catch { toast.error('Errore caricamento clienti') }
        finally { setLoading(false) }
    }

    const resetForm = () => { setForm({ nome: '', tipo: 'privato', referente: '', telefono: '', email: '', indirizzo: '', citta: '', cap: '', codice_fiscale: '', partita_iva: '', note: '' }); setEditingId(null) }

    const openEdit = (c: Cliente) => {
        setForm({ nome: c.nome, tipo: c.tipo, referente: c.referente || '', telefono: c.telefono || '', email: c.email || '', indirizzo: c.indirizzo || '', citta: c.citta || '', cap: c.cap || '', codice_fiscale: c.codice_fiscale || '', partita_iva: c.partita_iva || '', note: c.note || '' })
        setEditingId(c.id); setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.nome.trim()) return toast.error('Il nome è obbligatorio')
        setSaving(true)
        try {
            const payload = { ...form, referente: form.referente || null, telefono: form.telefono || null, email: form.email || null, indirizzo: form.indirizzo || null, citta: form.citta || null, cap: form.cap || null, codice_fiscale: form.codice_fiscale || null, partita_iva: form.partita_iva || null, note: form.note || null }
            if (editingId) { await updateCliente(editingId, payload); toast.success('Cliente aggiornato') }
            else { await insertCliente(payload); toast.success('Cliente aggiunto') }
            setDialogOpen(false); resetForm(); await loadData()
        } catch { toast.error('Errore salvataggio') }
        finally { setSaving(false) }
    }

    const filtered = clienti.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.citta?.toLowerCase().includes(search.toLowerCase()) || c.referente?.toLowerCase().includes(search.toLowerCase()))

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

    return (
        <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Clienti</h1>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild><Button size="lg" className="touch-target gap-2 rounded-xl font-semibold"><Plus className="h-5 w-5" /> Nuovo</Button></DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                            <div className="flex gap-2">
                                <button onClick={() => setForm(f => ({ ...f, tipo: 'privato' }))} className={cn('flex-1 p-3 rounded-xl border text-sm font-medium transition-all', form.tipo === 'privato' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground')}><User className="h-4 w-4 mx-auto mb-1" /> Privato</button>
                                <button onClick={() => setForm(f => ({ ...f, tipo: 'azienda' }))} className={cn('flex-1 p-3 rounded-xl border text-sm font-medium transition-all', form.tipo === 'azienda' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground')}><Building2 className="h-4 w-4 mx-auto mb-1" /> Azienda</button>
                            </div>
                            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder={form.tipo === 'azienda' ? 'Ragione sociale' : 'Nome e cognome'} className="mt-1 touch-target" /></div>
                            {form.tipo === 'azienda' && <div><Label>Referente</Label><Input value={form.referente} onChange={e => setForm(f => ({ ...f, referente: e.target.value }))} className="mt-1" /></div>}
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Telefono</Label><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} type="tel" className="mt-1" /></div>
                                <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" className="mt-1" /></div>
                            </div>
                            <div><Label>Indirizzo</Label><Input value={form.indirizzo} onChange={e => setForm(f => ({ ...f, indirizzo: e.target.value }))} className="mt-1" /></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Città</Label><Input value={form.citta} onChange={e => setForm(f => ({ ...f, citta: e.target.value }))} className="mt-1" /></div>
                                <div><Label>CAP</Label><Input value={form.cap} onChange={e => setForm(f => ({ ...f, cap: e.target.value }))} className="mt-1" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><Label>Codice Fiscale</Label><Input value={form.codice_fiscale} onChange={e => setForm(f => ({ ...f, codice_fiscale: e.target.value }))} className="mt-1" /></div>
                                <div><Label>Partita IVA</Label><Input value={form.partita_iva} onChange={e => setForm(f => ({ ...f, partita_iva: e.target.value }))} className="mt-1" /></div>
                            </div>
                            <div><Label>Note</Label><Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="mt-1" /></div>
                            <Button onClick={handleSave} disabled={saving} className="w-full touch-target rounded-xl font-semibold">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Salva Modifiche' : 'Aggiungi Cliente'}</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cerca clienti..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 touch-target rounded-xl" />
            </div>

            <div className="space-y-2">
                {filtered.map(c => (
                    <Card key={c.id} className="shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4">
                            <Link href={`/clienti/${c.id}`} className="flex items-start gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        {c.tipo === 'azienda' ? <Building2 className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                                    </div>
                                    <div className="min-w-0"><p className="font-medium truncate">{c.nome}</p>{c.referente && <p className="text-xs text-muted-foreground">Ref: {c.referente}</p>}</div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                            </Link>
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {c.telefono && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.telefono}</span>}
                                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                                    {c.citta && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.citta}</span>}
                                </div>
                                <button onClick={e => { e.stopPropagation(); openEdit(c) }} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">Nessun cliente trovato</p>}
            </div>
        </div>
    )
}
