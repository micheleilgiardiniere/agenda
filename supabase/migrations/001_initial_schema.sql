-- ============================================================
-- GESTIONALE GIARDINAGGIO — Schema Iniziale
-- ============================================================

-- ENUMS
CREATE TYPE tipologia_progetto AS ENUM ('economia', 'preventivo');
CREATE TYPE unita_misura AS ENUM ('ore', 'pz', 'kg', 'lt', 'mq', 'ml', 'forfait');
CREATE TYPE tipo_catalogo AS ENUM ('servizio', 'materiale');
CREATE TYPE stato_contabile AS ENUM ('da_contabilizzare', 'conto_finito', 'fatturato', 'pagato');
CREATE TYPE priorita AS ENUM ('bassa', 'media', 'alta', 'urgente');
CREATE TYPE frequenza_ricorrenza AS ENUM ('settimanale', 'bisettimanale', 'mensile', 'bimestrale', 'trimestrale', 'semestrale', 'annuale');

-- 1. CLIENTI
CREATE TABLE clienti (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          TEXT NOT NULL,
  tipo          TEXT DEFAULT 'privato',
  referente     TEXT,
  telefono      TEXT,
  email         TEXT,
  indirizzo     TEXT,
  citta         TEXT,
  cap           TEXT,
  codice_fiscale TEXT,
  partita_iva   TEXT,
  note          TEXT,
  attivo        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. DIPENDENTI
CREATE TABLE dipendenti (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  cognome         TEXT NOT NULL,
  telefono        TEXT,
  costo_orario    NUMERIC(8,2) NOT NULL DEFAULT 0,
  attivo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. CATALOGO
CREATE TABLE catalogo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  tipo            tipo_catalogo NOT NULL,
  unita_misura    unita_misura NOT NULL DEFAULT 'pz',
  prezzo_listino  NUMERIC(10,2) NOT NULL DEFAULT 0,
  note            TEXT,
  attivo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. PROGETTI / CANTIERI
CREATE TABLE progetti (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL REFERENCES clienti(id) ON DELETE RESTRICT,
  nome              TEXT NOT NULL,
  tipologia         tipologia_progetto NOT NULL,
  importo_preventivo NUMERIC(12,2),
  descrizione       TEXT,
  indirizzo_cantiere TEXT,
  data_inizio       DATE,
  data_fine_prevista DATE,
  attivo            BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 5. INTERVENTI PROGRAMMATI
CREATE TABLE interventi_programmati (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progetto_id     UUID NOT NULL REFERENCES progetti(id) ON DELETE CASCADE,
  titolo          TEXT NOT NULL,
  frequenza       frequenza_ricorrenza NOT NULL,
  giorno_mese     INTEGER,
  giorno_settimana INTEGER,
  data_inizio     DATE NOT NULL,
  data_fine       DATE,
  note            TEXT,
  attivo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. DOCUMENTI CONTABILI (creata prima per FK)
CREATE TABLE documenti (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id        UUID NOT NULL REFERENCES clienti(id) ON DELETE RESTRICT,
  numero            TEXT,
  tipo              TEXT DEFAULT 'conto',
  data_emissione    DATE DEFAULT CURRENT_DATE,
  subtotale         NUMERIC(12,2) DEFAULT 0,
  sconto_percentuale NUMERIC(5,2) DEFAULT 0,
  sconto_importo    NUMERIC(12,2) DEFAULT 0,
  totale            NUMERIC(12,2) DEFAULT 0,
  note              TEXT,
  stato             stato_contabile DEFAULT 'conto_finito',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 7. INTERVENTI GIORNALIERI
CREATE TABLE interventi (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progetto_id     UUID NOT NULL REFERENCES progetti(id) ON DELETE RESTRICT,
  programmato_id  UUID REFERENCES interventi_programmati(id),
  data            DATE NOT NULL,
  note            TEXT,
  stato_contabile stato_contabile DEFAULT 'da_contabilizzare',
  documento_id    UUID REFERENCES documenti(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_interventi_data ON interventi(data);
CREATE INDEX idx_interventi_progetto ON interventi(progetto_id);
CREATE INDEX idx_interventi_stato ON interventi(stato_contabile);

-- 8. MANODOPERA
CREATE TABLE interventi_manodopera (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervento_id   UUID NOT NULL REFERENCES interventi(id) ON DELETE CASCADE,
  dipendente_id   UUID NOT NULL REFERENCES dipendenti(id) ON DELETE RESTRICT,
  ore             NUMERIC(5,2) NOT NULL,
  costo_orario    NUMERIC(8,2) NOT NULL,
  note            TEXT,
  UNIQUE(intervento_id, dipendente_id)
);

-- 9. MATERIALI USATI
CREATE TABLE interventi_materiali (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervento_id   UUID NOT NULL REFERENCES interventi(id) ON DELETE CASCADE,
  catalogo_id     UUID NOT NULL REFERENCES catalogo(id) ON DELETE RESTRICT,
  quantita        NUMERIC(10,2) NOT NULL,
  prezzo_applicato NUMERIC(10,2) NOT NULL,
  note            TEXT
);

-- 10. RIGHE DOCUMENTO
CREATE TABLE documenti_righe (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id    UUID NOT NULL REFERENCES documenti(id) ON DELETE CASCADE,
  descrizione     TEXT NOT NULL,
  quantita        NUMERIC(10,2) DEFAULT 1,
  prezzo_unitario NUMERIC(10,2) NOT NULL,
  totale_riga     NUMERIC(12,2) NOT NULL,
  intervento_id   UUID REFERENCES interventi(id),
  sort_order      INTEGER DEFAULT 0
);

-- 11. PAGAMENTI / ACCONTI
CREATE TABLE pagamenti (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id    UUID NOT NULL REFERENCES documenti(id) ON DELETE CASCADE,
  data            DATE NOT NULL DEFAULT CURRENT_DATE,
  importo         NUMERIC(12,2) NOT NULL,
  metodo          TEXT DEFAULT 'contanti',
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 12. TODO / LAVORI FUTURI
CREATE TABLE todo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progetto_id     UUID REFERENCES progetti(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clienti(id) ON DELETE CASCADE,
  titolo          TEXT NOT NULL,
  descrizione     TEXT,
  priorita        priorita DEFAULT 'media',
  data_scadenza   DATE,
  completato      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_clienti_updated BEFORE UPDATE ON clienti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_dipendenti_updated BEFORE UPDATE ON dipendenti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_catalogo_updated BEFORE UPDATE ON catalogo FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_progetti_updated BEFORE UPDATE ON progetti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_interventi_updated BEFORE UPDATE ON interventi FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_documenti_updated BEFORE UPDATE ON documenti FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_todo_updated BEFORE UPDATE ON todo FOR EACH ROW EXECUTE FUNCTION update_updated_at();
