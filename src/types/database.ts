// ============================================================
// TypeScript Types — Gestionale Giardinaggio
// ============================================================

export type TipologiaProgetto = 'economia' | 'preventivo'
export type UnitaMisura = 'ore' | 'pz' | 'kg' | 'lt' | 'mq' | 'ml' | 'forfait'
export type TipoCatalogo = 'servizio' | 'materiale'
export type StatoContabile = 'da_contabilizzare' | 'conto_finito' | 'fatturato' | 'pagato'
export type Priorita = 'bassa' | 'media' | 'alta' | 'urgente'
export type FrequenzaRicorrenza = 'settimanale' | 'bisettimanale' | 'mensile' | 'bimestrale' | 'trimestrale' | 'semestrale' | 'annuale'

// ---------- Row Types ----------

export interface Cliente {
    id: string
    nome: string
    tipo: string
    referente: string | null
    telefono: string | null
    email: string | null
    indirizzo: string | null
    citta: string | null
    cap: string | null
    codice_fiscale: string | null
    partita_iva: string | null
    note: string | null
    attivo: boolean
    created_at: string
    updated_at: string
}

export interface Dipendente {
    id: string
    nome: string
    cognome: string
    telefono: string | null
    costo_orario: number
    attivo: boolean
    created_at: string
    updated_at: string
}

export interface CatalogoItem {
    id: string
    nome: string
    tipo: TipoCatalogo
    unita_misura: UnitaMisura
    prezzo_listino: number
    note: string | null
    attivo: boolean
    created_at: string
    updated_at: string
}

export interface Progetto {
    id: string
    cliente_id: string
    nome: string
    tipologia: TipologiaProgetto
    importo_preventivo: number | null
    descrizione: string | null
    indirizzo_cantiere: string | null
    data_inizio: string | null
    data_fine_prevista: string | null
    attivo: boolean
    created_at: string
    updated_at: string
    // Joined
    cliente?: Cliente
}

export interface InterventoProgrammato {
    id: string
    progetto_id: string
    titolo: string
    frequenza: FrequenzaRicorrenza
    giorno_mese: number | null
    giorno_settimana: number | null
    data_inizio: string
    data_fine: string | null
    note: string | null
    attivo: boolean
    created_at: string
}

export interface Intervento {
    id: string
    progetto_id: string
    programmato_id: string | null
    data: string
    note: string | null
    stato_contabile: StatoContabile
    documento_id: string | null
    created_at: string
    updated_at: string
    // Joined
    progetto?: Progetto & { cliente?: Cliente }
    manodopera?: InterventoManodopera[]
    materiali?: InterventoMateriale[]
}

export interface InterventoManodopera {
    id: string
    intervento_id: string
    dipendente_id: string
    ore: number
    costo_orario: number
    note: string | null
    // Joined
    dipendente?: Dipendente
}

export interface InterventoMateriale {
    id: string
    intervento_id: string
    catalogo_id: string
    quantita: number
    prezzo_applicato: number
    note: string | null
    // Joined
    catalogo?: CatalogoItem
}

export interface Documento {
    id: string
    cliente_id: string
    numero: string | null
    tipo: string
    data_emissione: string
    subtotale: number
    sconto_percentuale: number
    sconto_importo: number
    totale: number
    note: string | null
    stato: StatoContabile
    created_at: string
    updated_at: string
    // Joined
    cliente?: Cliente
    righe?: DocumentoRiga[]
    pagamenti?: Pagamento[]
}

export interface DocumentoRiga {
    id: string
    documento_id: string
    descrizione: string
    quantita: number
    prezzo_unitario: number
    totale_riga: number
    intervento_id: string | null
    sort_order: number
}

export interface Pagamento {
    id: string
    documento_id: string
    data: string
    importo: number
    metodo: string
    note: string | null
    created_at: string
}

export interface Todo {
    id: string
    progetto_id: string | null
    cliente_id: string | null
    titolo: string
    descrizione: string | null
    priorita: Priorita
    data_scadenza: string | null
    completato: boolean
    created_at: string
    updated_at: string
    // Joined
    progetto?: Progetto
    cliente?: Cliente
}

// ---------- Insert Types ----------

export type ClienteInsert = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
export type DipendenteInsert = Omit<Dipendente, 'id' | 'created_at' | 'updated_at'>
export type CatalogoItemInsert = Omit<CatalogoItem, 'id' | 'created_at' | 'updated_at'>
export type ProgettoInsert = Omit<Progetto, 'id' | 'created_at' | 'updated_at' | 'cliente'>
export type InterventoInsert = Omit<Intervento, 'id' | 'created_at' | 'updated_at' | 'progetto' | 'manodopera' | 'materiali'>
export type TodoInsert = Omit<Todo, 'id' | 'created_at' | 'updated_at' | 'progetto' | 'cliente'>

// ---------- Supabase Database type (minimal) ----------

export interface Database {
    public: {
        Tables: {
            clienti: { Row: Cliente; Insert: ClienteInsert }
            dipendenti: { Row: Dipendente; Insert: DipendenteInsert }
            catalogo: { Row: CatalogoItem; Insert: CatalogoItemInsert }
            progetti: { Row: Progetto; Insert: ProgettoInsert }
            interventi_programmati: { Row: InterventoProgrammato }
            interventi: { Row: Intervento; Insert: InterventoInsert }
            interventi_manodopera: { Row: InterventoManodopera }
            interventi_materiali: { Row: InterventoMateriale }
            documenti: { Row: Documento }
            documenti_righe: { Row: DocumentoRiga }
            pagamenti: { Row: Pagamento }
            todo: { Row: Todo; Insert: TodoInsert }
        }
    }
}
