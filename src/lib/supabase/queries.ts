import { createClient } from './client'

const supabase = createClient()

// ─── CLIENTI ──────────────────────────────────────
export async function getClienti() {
    const { data, error } = await supabase.from('clienti').select('*').eq('attivo', true).order('nome')
    if (error) throw error
    return data
}

export async function getCliente(id: string) {
    const { data, error } = await supabase.from('clienti').select('*').eq('id', id).single()
    if (error) throw error
    return data
}

export async function insertCliente(values: Record<string, unknown>) {
    const { data, error } = await supabase.from('clienti').insert(values).select().single()
    if (error) throw error
    return data
}

export async function updateCliente(id: string, values: Record<string, unknown>) {
    const { data, error } = await supabase.from('clienti').update(values).eq('id', id).select().single()
    if (error) throw error
    return data
}

// ─── DIPENDENTI ───────────────────────────────────
export async function getDipendenti() {
    const { data, error } = await supabase.from('dipendenti').select('*').eq('attivo', true).order('cognome')
    if (error) throw error
    return data
}

export async function insertDipendente(values: Record<string, unknown>) {
    const { data, error } = await supabase.from('dipendenti').insert(values).select().single()
    if (error) throw error
    return data
}

export async function updateDipendente(id: string, values: Record<string, unknown>) {
    const { data, error } = await supabase.from('dipendenti').update(values).eq('id', id).select().single()
    if (error) throw error
    return data
}

// ─── CATALOGO ─────────────────────────────────────
export async function getCatalogo() {
    const { data, error } = await supabase.from('catalogo').select('*').eq('attivo', true).order('nome')
    if (error) throw error
    return data
}

export async function insertCatalogo(values: Record<string, unknown>) {
    const { data, error } = await supabase.from('catalogo').insert(values).select().single()
    if (error) throw error
    return data
}

export async function updateCatalogo(id: string, values: Record<string, unknown>) {
    const { data, error } = await supabase.from('catalogo').update(values).eq('id', id).select().single()
    if (error) throw error
    return data
}

// ─── PROGETTI ─────────────────────────────────────
export async function getProgetti() {
    const { data, error } = await supabase.from('progetti').select('*, clienti(id, nome)').eq('attivo', true).order('nome')
    if (error) throw error
    return data
}

export async function getProgettiByCliente(clienteId: string) {
    const { data, error } = await supabase.from('progetti').select('*').eq('cliente_id', clienteId).eq('attivo', true).order('nome')
    if (error) throw error
    return data
}

export async function insertProgetto(values: Record<string, unknown>) {
    const { data, error } = await supabase.from('progetti').insert(values).select().single()
    if (error) throw error
    return data
}

export async function updateProgetto(id: string, values: Record<string, unknown>) {
    const { data, error } = await supabase.from('progetti').update(values).eq('id', id).select().single()
    if (error) throw error
    return data
}

// ─── INTERVENTI ───────────────────────────────────
export async function getInterventi() {
    const { data, error } = await supabase
        .from('interventi')
        .select('*, progetti(id, nome, tipologia, cliente_id, clienti(id, nome)), interventi_manodopera(*, dipendenti(id, nome, cognome)), interventi_materiali(*, catalogo(id, nome, unita_misura))')
        .order('data', { ascending: false })
    if (error) throw error
    return data
}

export async function getInterventiByProgetto(progettoId: string) {
    const { data, error } = await supabase
        .from('interventi')
        .select('*, progetti(id, nome, tipologia, cliente_id, clienti(id, nome)), interventi_manodopera(*, dipendenti(id, nome, cognome)), interventi_materiali(*, catalogo(id, nome, unita_misura))')
        .eq('progetto_id', progettoId)
        .order('data', { ascending: false })
    if (error) throw error
    return data
}

export async function getInterventiByDate(date: string) {
    const { data, error } = await supabase
        .from('interventi')
        .select('*, progetti(id, nome, tipologia, clienti(id, nome))')
        .eq('data', date)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export async function getInterventiByStato(stato: string) {
    const { data, error } = await supabase
        .from('interventi')
        .select('*, progetti(id, nome, tipologia, clienti(id, nome)), interventi_manodopera(*, dipendenti(id, nome, cognome)), interventi_materiali(*, catalogo(id, nome, unita_misura))')
        .eq('stato_contabile', stato)
        .order('data', { ascending: false })
    if (error) throw error
    return data
}

export async function insertIntervento(values: { data: string; progetto_id: string; note: string; manodopera: { dipendente_id: string; ore: number; costo_orario: number }[]; materiali: { catalogo_id: string; quantita: number; prezzo_applicato: number }[] }) {
    // 1. Insert intervento
    const { data: interv, error: e1 } = await supabase
        .from('interventi')
        .insert({ data: values.data, progetto_id: values.progetto_id, note: values.note || null })
        .select()
        .single()
    if (e1) throw e1

    // 2. Insert manodopera rows
    if (values.manodopera.length > 0) {
        const { error: e2 } = await supabase.from('interventi_manodopera').insert(
            values.manodopera.map(m => ({ intervento_id: interv.id, dipendente_id: m.dipendente_id, ore: m.ore, costo_orario: m.costo_orario }))
        )
        if (e2) throw e2
    }

    // 3. Insert materiali rows
    if (values.materiali.length > 0) {
        const { error: e3 } = await supabase.from('interventi_materiali').insert(
            values.materiali.map(m => ({ intervento_id: interv.id, catalogo_id: m.catalogo_id, quantita: m.quantita, prezzo_applicato: m.prezzo_applicato }))
        )
        if (e3) throw e3
    }

    return interv
}

export async function updateInterventoStato(id: string, stato: string) {
    const { error } = await supabase.from('interventi').update({ stato_contabile: stato }).eq('id', id)
    if (error) throw error
}

export async function deleteIntervento(id: string) {
    const { error } = await supabase.from('interventi').delete().eq('id', id)
    if (error) throw error
}

// ─── TODO ─────────────────────────────────────────
export async function getTodos() {
    const { data, error } = await supabase.from('todo').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export async function insertTodo(values: Record<string, unknown>) {
    const { data, error } = await supabase.from('todo').insert(values).select().single()
    if (error) throw error
    return data
}

export async function updateTodo(id: string, values: Record<string, unknown>) {
    const { error } = await supabase.from('todo').update(values).eq('id', id)
    if (error) throw error
}

// ─── DASHBOARD HELPERS ────────────────────────────
export async function getInterventiFuturo(fromDate: string, toDate: string) {
    const { data, error } = await supabase
        .from('interventi')
        .select('data, progetti(nome, tipologia)')
        .gte('data', fromDate)
        .lte('data', toDate)
    if (error) throw error
    return data
}
