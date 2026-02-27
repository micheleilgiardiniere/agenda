#!/bin/bash
# Seed script — Dati di prova per GreenWork
URL="https://muuesqhppeejgoocuyxh.supabase.co/rest/v1"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dWVzcWhwcGVlamdvb2N1eXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDQ3MDIsImV4cCI6MjA4Nzc4MDcwMn0.1WbalPH4m4OUr8nSCDp-NakRpipy2m2eGo1p7fgw75A"
H1="apikey: $KEY"
H2="Authorization: Bearer $KEY"
H3="Content-Type: application/json"
H4="Prefer: return=representation"

# Clean existing data (order matters for FK)
echo "🧹 Pulizia dati esistenti..."
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/interventi_materiali?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/interventi_manodopera?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/interventi?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/todo?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/progetti?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/dipendenti?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/catalogo?id=not.is.null" > /dev/null
curl -s -X DELETE -H "$H1" -H "$H2" "$URL/clienti?id=not.is.null" > /dev/null

# ─── CLIENTI ────────────────────────────────
echo "👤 Inserimento clienti..."
CLIENTI=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/clienti" -d '[
  {"nome":"Mario Rossi","tipo":"privato","telefono":"338 1234567","email":"mario@email.it","indirizzo":"Via Roma 15","citta":"Milano","cap":"20121"},
  {"nome":"Condominio Aurora","tipo":"azienda","referente":"Sig.ra Bianchi","telefono":"02 9876543","email":"admin@condaurora.it","indirizzo":"Viale Monza 45","citta":"Milano","cap":"20127"},
  {"nome":"Luca Verdi","tipo":"privato","telefono":"339 7654321","email":"luca.verdi@gmail.com","indirizzo":"Via Garibaldi 8","citta":"Monza","cap":"20900"},
  {"nome":"Villa Borghese Srl","tipo":"azienda","referente":"Dott. Neri","telefono":"06 5551234","email":"info@villaborghese.it","indirizzo":"Via Appia 120","citta":"Roma","cap":"00179","partita_iva":"IT01234567890"},
  {"nome":"Elena Colombo","tipo":"privato","telefono":"347 8889990","email":"elena.colombo@pec.it","indirizzo":"Corso Como 22","citta":"Milano","cap":"20154"}
]')
echo "$CLIENTI" | python3 -c "import json,sys; data=json.load(sys.stdin); [print(f'  → {r[\"nome\"]} ({r[\"id\"][:8]}...)') for r in data]"

# Extract IDs
C1=$(echo "$CLIENTI" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
C2=$(echo "$CLIENTI" | python3 -c "import json,sys; print(json.load(sys.stdin)[1]['id'])")
C3=$(echo "$CLIENTI" | python3 -c "import json,sys; print(json.load(sys.stdin)[2]['id'])")
C4=$(echo "$CLIENTI" | python3 -c "import json,sys; print(json.load(sys.stdin)[3]['id'])")
C5=$(echo "$CLIENTI" | python3 -c "import json,sys; print(json.load(sys.stdin)[4]['id'])")

# ─── DIPENDENTI ────────────────────────────
echo "👷 Inserimento dipendenti..."
DIPS=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/dipendenti" -d '[
  {"nome":"Paolo","cognome":"Bianchi","telefono":"340 1111111","costo_orario":25},
  {"nome":"Marco","cognome":"Ferretti","telefono":"340 2222222","costo_orario":22},
  {"nome":"Giovanni","cognome":"Russo","telefono":"340 3333333","costo_orario":20},
  {"nome":"Andrea","cognome":"Moretti","telefono":"340 4444444","costo_orario":18}
]')
echo "$DIPS" | python3 -c "import json,sys; data=json.load(sys.stdin); [print(f'  → {r[\"nome\"]} {r[\"cognome\"]} (€{r[\"costo_orario\"]}/h)') for r in data]"

D1=$(echo "$DIPS" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
D2=$(echo "$DIPS" | python3 -c "import json,sys; print(json.load(sys.stdin)[1]['id'])")
D3=$(echo "$DIPS" | python3 -c "import json,sys; print(json.load(sys.stdin)[2]['id'])")
D4=$(echo "$DIPS" | python3 -c "import json,sys; print(json.load(sys.stdin)[3]['id'])")

# ─── CATALOGO ──────────────────────────────
echo "📦 Inserimento catalogo..."
CATS=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/catalogo" -d '[
  {"nome":"Taglio prato","tipo":"servizio","unita_misura":"mq","prezzo_listino":0.15},
  {"nome":"Potatura siepi","tipo":"servizio","unita_misura":"ml","prezzo_listino":8.00},
  {"nome":"Potatura albero alto fusto","tipo":"servizio","unita_misura":"pz","prezzo_listino":120.00},
  {"nome":"Terra vegetale","tipo":"materiale","unita_misura":"kg","prezzo_listino":0.25},
  {"nome":"Concime granulare","tipo":"materiale","unita_misura":"kg","prezzo_listino":3.50},
  {"nome":"Piantine stagionali","tipo":"materiale","unita_misura":"pz","prezzo_listino":2.80},
  {"nome":"Telo pacciamatura","tipo":"materiale","unita_misura":"mq","prezzo_listino":4.50},
  {"nome":"Irrigazione a goccia","tipo":"servizio","unita_misura":"ml","prezzo_listino":12.00},
  {"nome":"Ghiaia decorativa","tipo":"materiale","unita_misura":"kg","prezzo_listino":0.40},
  {"nome":"Smaltimento verde","tipo":"servizio","unita_misura":"forfait","prezzo_listino":80.00}
]')
echo "$CATS" | python3 -c "import json,sys; data=json.load(sys.stdin); [print(f'  → {r[\"nome\"]} (€{r[\"prezzo_listino\"]}/{r[\"unita_misura\"]})') for r in data]"

CAT1=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
CAT2=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[1]['id'])")
CAT3=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[2]['id'])")
CAT4=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[3]['id'])")
CAT5=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[4]['id'])")
CAT6=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[5]['id'])")
CAT7=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[6]['id'])")
CAT8=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[7]['id'])")
CAT9=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[8]['id'])")
CAT10=$(echo "$CATS" | python3 -c "import json,sys; print(json.load(sys.stdin)[9]['id'])")

# ─── PROGETTI ──────────────────────────────
echo "📂 Inserimento progetti..."
PROJS=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/progetti" -d "[
  {\"nome\":\"Giardino Villa Rossi\",\"cliente_id\":\"$C1\",\"tipologia\":\"economia\",\"descrizione\":\"Manutenzione giardino privato 500mq\",\"indirizzo_cantiere\":\"Via Roma 15, Milano\"},
  {\"nome\":\"Potatura alberi alto fusto\",\"cliente_id\":\"$C1\",\"tipologia\":\"economia\",\"descrizione\":\"Abbattimento e potatura pini e querce\"},
  {\"nome\":\"Manutenzione aree verdi\",\"cliente_id\":\"$C2\",\"tipologia\":\"preventivo\",\"importo_preventivo\":4800,\"descrizione\":\"Contratto annuale manutenzione condominio\",\"indirizzo_cantiere\":\"Viale Monza 45, Milano\"},
  {\"nome\":\"Nuovo giardino Verdi\",\"cliente_id\":\"$C3\",\"tipologia\":\"preventivo\",\"importo_preventivo\":8500,\"descrizione\":\"Progettazione e realizzazione giardino 300mq\",\"indirizzo_cantiere\":\"Via Garibaldi 8, Monza\"},
  {\"nome\":\"Parco privato Villa Borghese\",\"cliente_id\":\"$C4\",\"tipologia\":\"preventivo\",\"importo_preventivo\":15000,\"descrizione\":\"Riqualificazione parco 2000mq con irrigazione\",\"indirizzo_cantiere\":\"Via Appia 120, Roma\"},
  {\"nome\":\"Terrazzo Colombo\",\"cliente_id\":\"$C5\",\"tipologia\":\"economia\",\"descrizione\":\"Manutenzione terrazzo con fioriere\",\"indirizzo_cantiere\":\"Corso Como 22, Milano\"}
]")
echo "$PROJS" | python3 -c "import json,sys; data=json.load(sys.stdin); [print(f'  → {r[\"nome\"]} ({r[\"tipologia\"]})') for r in data]"

P1=$(echo "$PROJS" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
P2=$(echo "$PROJS" | python3 -c "import json,sys; print(json.load(sys.stdin)[1]['id'])")
P3=$(echo "$PROJS" | python3 -c "import json,sys; print(json.load(sys.stdin)[2]['id'])")
P4=$(echo "$PROJS" | python3 -c "import json,sys; print(json.load(sys.stdin)[3]['id'])")
P5=$(echo "$PROJS" | python3 -c "import json,sys; print(json.load(sys.stdin)[4]['id'])")
P6=$(echo "$PROJS" | python3 -c "import json,sys; print(json.load(sys.stdin)[5]['id'])")

# ─── INTERVENTI ────────────────────────────
echo "📋 Inserimento interventi..."

# Intervento 1: Rossi - taglio prato + siepi (oggi)
I1=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P1\",\"data\":\"2026-02-27\",\"note\":\"Taglio prato completo + siepi perimetrali\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I1\",\"dipendente_id\":\"$D1\",\"ore\":6,\"costo_orario\":25},{\"intervento_id\":\"$I1\",\"dipendente_id\":\"$D2\",\"ore\":6,\"costo_orario\":22}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I1\",\"catalogo_id\":\"$CAT5\",\"quantita\":5,\"prezzo_applicato\":3.50},{\"intervento_id\":\"$I1\",\"catalogo_id\":\"$CAT10\",\"quantita\":1,\"prezzo_applicato\":80}]" > /dev/null
echo "  → Rossi: taglio prato + siepi (27 feb)"

# Intervento 2: Rossi - precedente (22 feb)
I2=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P1\",\"data\":\"2026-02-22\",\"note\":\"Concimazione primaverile prato\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I2\",\"dipendente_id\":\"$D1\",\"ore\":4,\"costo_orario\":25}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I2\",\"catalogo_id\":\"$CAT5\",\"quantita\":20,\"prezzo_applicato\":3.50}]" > /dev/null
echo "  → Rossi: concimazione (22 feb)"

# Intervento 3: Rossi - potatura alberi (20 feb)
I3=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P2\",\"data\":\"2026-02-20\",\"note\":\"Abbattimento pino secco + potatura quercia\",\"stato_contabile\":\"conto_finito\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I3\",\"dipendente_id\":\"$D1\",\"ore\":8,\"costo_orario\":25},{\"intervento_id\":\"$I3\",\"dipendente_id\":\"$D2\",\"ore\":8,\"costo_orario\":22},{\"intervento_id\":\"$I3\",\"dipendente_id\":\"$D3\",\"ore\":8,\"costo_orario\":20}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I3\",\"catalogo_id\":\"$CAT10\",\"quantita\":2,\"prezzo_applicato\":80}]" > /dev/null
echo "  → Rossi: potatura alberi (20 feb) — conto finito"

# Intervento 4: Cond. Aurora - manutenzione (26 feb)
I4=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P3\",\"data\":\"2026-02-26\",\"note\":\"Taglio prato aree comuni + pulizia aiuole\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I4\",\"dipendente_id\":\"$D2\",\"ore\":7,\"costo_orario\":22},{\"intervento_id\":\"$I4\",\"dipendente_id\":\"$D4\",\"ore\":7,\"costo_orario\":18}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I4\",\"catalogo_id\":\"$CAT10\",\"quantita\":1,\"prezzo_applicato\":80}]" > /dev/null
echo "  → Cond. Aurora: manutenzione (26 feb)"

# Intervento 5: Cond. Aurora - precedente (12 feb) — fatturato
I5=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P3\",\"data\":\"2026-02-12\",\"note\":\"Potatura siepi ingresso + pulizia foglie\",\"stato_contabile\":\"fatturato\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I5\",\"dipendente_id\":\"$D2\",\"ore\":5,\"costo_orario\":22},{\"intervento_id\":\"$I5\",\"dipendente_id\":\"$D3\",\"ore\":5,\"costo_orario\":20}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I5\",\"catalogo_id\":\"$CAT10\",\"quantita\":1,\"prezzo_applicato\":80}]" > /dev/null
echo "  → Cond. Aurora: potatura siepi (12 feb) — fatturato"

# Intervento 6: Verdi - nuovo giardino fase 1 (25 feb)
I6=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P4\",\"data\":\"2026-02-25\",\"note\":\"Scavo, livellamento terreno e posa telo pacciamatura\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I6\",\"dipendente_id\":\"$D1\",\"ore\":8,\"costo_orario\":25},{\"intervento_id\":\"$I6\",\"dipendente_id\":\"$D2\",\"ore\":8,\"costo_orario\":22},{\"intervento_id\":\"$I6\",\"dipendente_id\":\"$D3\",\"ore\":8,\"costo_orario\":20},{\"intervento_id\":\"$I6\",\"dipendente_id\":\"$D4\",\"ore\":8,\"costo_orario\":18}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I6\",\"catalogo_id\":\"$CAT4\",\"quantita\":500,\"prezzo_applicato\":0.25},{\"intervento_id\":\"$I6\",\"catalogo_id\":\"$CAT7\",\"quantita\":100,\"prezzo_applicato\":4.50}]" > /dev/null
echo "  → Verdi: nuovo giardino fase 1 (25 feb)"

# Intervento 7: Verdi - fase 2 (27 feb, oggi)
I7=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P4\",\"data\":\"2026-02-27\",\"note\":\"Posa piantine + impianto irrigazione\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I7\",\"dipendente_id\":\"$D1\",\"ore\":8,\"costo_orario\":25},{\"intervento_id\":\"$I7\",\"dipendente_id\":\"$D3\",\"ore\":8,\"costo_orario\":20}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I7\",\"catalogo_id\":\"$CAT6\",\"quantita\":80,\"prezzo_applicato\":2.80},{\"intervento_id\":\"$I7\",\"catalogo_id\":\"$CAT8\",\"quantita\":30,\"prezzo_applicato\":12.00}]" > /dev/null
echo "  → Verdi: piantine + irrigazione (27 feb)"

# Intervento 8: Villa Borghese - fase 1 (18 feb) — pagato
I8=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P5\",\"data\":\"2026-02-18\",\"note\":\"Rimozione sterpaglie e pulizia area\",\"stato_contabile\":\"pagato\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I8\",\"dipendente_id\":\"$D1\",\"ore\":8,\"costo_orario\":25},{\"intervento_id\":\"$I8\",\"dipendente_id\":\"$D2\",\"ore\":8,\"costo_orario\":22},{\"intervento_id\":\"$I8\",\"dipendente_id\":\"$D3\",\"ore\":8,\"costo_orario\":20},{\"intervento_id\":\"$I8\",\"dipendente_id\":\"$D4\",\"ore\":8,\"costo_orario\":18}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I8\",\"catalogo_id\":\"$CAT10\",\"quantita\":3,\"prezzo_applicato\":80}]" > /dev/null
echo "  → Villa Borghese: pulizia area (18 feb) — pagato"

# Intervento 9: Colombo terrazzo (24 feb)
I9=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P6\",\"data\":\"2026-02-24\",\"note\":\"Sostituzione piantine fioriere terrazzo\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I9\",\"dipendente_id\":\"$D4\",\"ore\":4,\"costo_orario\":18}]" > /dev/null
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_materiali" -d "[{\"intervento_id\":\"$I9\",\"catalogo_id\":\"$CAT6\",\"quantita\":24,\"prezzo_applicato\":2.80},{\"intervento_id\":\"$I9\",\"catalogo_id\":\"$CAT4\",\"quantita\":30,\"prezzo_applicato\":0.25}]" > /dev/null
echo "  → Colombo: fioriere terrazzo (24 feb)"

# Intervento 10: futuro - Rossi (3 marzo)
I10=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P1\",\"data\":\"2026-03-03\",\"note\":\"Programmato: taglio prato mensile\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I10\",\"dipendente_id\":\"$D1\",\"ore\":5,\"costo_orario\":25},{\"intervento_id\":\"$I10\",\"dipendente_id\":\"$D2\",\"ore\":5,\"costo_orario\":22}]" > /dev/null
echo "  → Rossi: prossimo taglio (3 marzo)"

# Intervento 11: futuro - Cond. Aurora (5 marzo)
I11=$(curl -s -X POST -H "$H1" -H "$H2" -H "$H3" -H "$H4" "$URL/interventi" -d "{\"progetto_id\":\"$P3\",\"data\":\"2026-03-05\",\"note\":\"Programmato: manutenzione mensile\"}" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/interventi_manodopera" -d "[{\"intervento_id\":\"$I11\",\"dipendente_id\":\"$D2\",\"ore\":6,\"costo_orario\":22},{\"intervento_id\":\"$I11\",\"dipendente_id\":\"$D4\",\"ore\":6,\"costo_orario\":18}]" > /dev/null
echo "  → Cond. Aurora: manutenzione (5 marzo)"

# ─── TODO ──────────────────────────────────
echo "📝 Inserimento todo..."
curl -s -X POST -H "$H1" -H "$H2" -H "$H3" "$URL/todo" -d "[
  {\"titolo\":\"Preventivo recinzione Villa Rossi\",\"descrizione\":\"Il cliente ha chiesto un preventivo per recinzione lato nord del giardino\",\"priorita\":\"alta\",\"data_scadenza\":\"2026-03-01\",\"cliente_id\":\"$C1\"},
  {\"titolo\":\"Ordinare piantine per primavera\",\"descrizione\":\"Contattare vivaio per ordine stagionale: gerani, petunie, surfinie\",\"priorita\":\"urgente\",\"data_scadenza\":\"2026-02-28\"},
  {\"titolo\":\"Sopralluogo nuovo cliente zona Brera\",\"descrizione\":\"Contatto ricevuto per manutenzione terrazzo 80mq\",\"priorita\":\"media\",\"data_scadenza\":\"2026-03-05\"},
  {\"titolo\":\"Manutenzione attrezzature\",\"descrizione\":\"Revisione decespugliatore e affilatura lame tosaerba\",\"priorita\":\"bassa\"},
  {\"titolo\":\"Fattura condominio Aurora febbraio\",\"descrizione\":\"Emettere fattura per lavori di febbraio\",\"priorita\":\"alta\",\"data_scadenza\":\"2026-03-10\",\"cliente_id\":\"$C2\"},
  {\"titolo\":\"Sopralluogo Verdi per fase 3\",\"descrizione\":\"Verificare crescita piantine e programmare posa ghiaia\",\"priorita\":\"media\",\"data_scadenza\":\"2026-03-15\",\"cliente_id\":\"$C3\"}
]" > /dev/null
echo "  → 6 attività inserite"

echo ""
echo "✅ Seed completato!"
echo "   5 clienti, 4 dipendenti, 10 voci catalogo"
echo "   6 progetti, 11 interventi, 6 todo"
