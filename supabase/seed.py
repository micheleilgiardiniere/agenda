#!/usr/bin/env python3
"""Seed script — Dati di prova per GreenWork"""
import json, urllib.request, sys

URL = "https://muuesqhppeejgoocuyxh.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11dWVzcWhwcGVlamdvb2N1eXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDQ3MDIsImV4cCI6MjA4Nzc4MDcwMn0.1WbalPH4m4OUr8nSCDp-NakRpipy2m2eGo1p7fgw75A"

def req(method, path, data=None):
    headers = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=representation"}
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(f"{URL}/{path}", data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return json.loads(resp.read()) if resp.status in (200, 201) else []
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ❌ {method} {path}: {err}", file=sys.stderr)
        return []

def delete(table):
    req("DELETE", f"{table}?id=not.is.null")

def insert(table, rows):
    result = req("POST", table, rows)
    return result

# ─── CLEAN UP ──────────────────────────────
print("🧹 Pulizia dati esistenti...")
for t in ["interventi_materiali","interventi_manodopera","documenti_righe","pagamenti","documenti","interventi","todo","interventi_programmati","progetti","dipendenti","catalogo","clienti"]:
    delete(t)

# ─── CLIENTI ───────────────────────────────
print("👤 Inserimento clienti...")
clienti = insert("clienti", [
    {"nome":"Mario Rossi","tipo":"privato","referente":None,"telefono":"338 1234567","email":"mario@email.it","indirizzo":"Via Roma 15","citta":"Milano","cap":"20121","partita_iva":None},
    {"nome":"Condominio Aurora","tipo":"azienda","referente":"Sig.ra Bianchi","telefono":"02 9876543","email":"admin@condaurora.it","indirizzo":"Viale Monza 45","citta":"Milano","cap":"20127","partita_iva":None},
    {"nome":"Luca Verdi","tipo":"privato","referente":None,"telefono":"339 7654321","email":"luca.verdi@gmail.com","indirizzo":"Via Garibaldi 8","citta":"Monza","cap":"20900","partita_iva":None},
    {"nome":"Villa Borghese Srl","tipo":"azienda","referente":"Dott. Neri","telefono":"06 5551234","email":"info@villaborghese.it","indirizzo":"Via Appia 120","citta":"Roma","cap":"00179","partita_iva":"IT01234567890"},
    {"nome":"Elena Colombo","tipo":"privato","referente":None,"telefono":"347 8889990","email":"elena.colombo@pec.it","indirizzo":"Corso Como 22","citta":"Milano","cap":"20154","partita_iva":None},
])
for c in clienti: print(f"  → {c['nome']}")
C = {i: clienti[i]["id"] for i in range(len(clienti))}

# ─── DIPENDENTI ────────────────────────────
print("👷 Inserimento dipendenti...")
dips = insert("dipendenti", [
    {"nome":"Paolo","cognome":"Bianchi","telefono":"340 1111111","costo_orario":25},
    {"nome":"Marco","cognome":"Ferretti","telefono":"340 2222222","costo_orario":22},
    {"nome":"Giovanni","cognome":"Russo","telefono":"340 3333333","costo_orario":20},
    {"nome":"Andrea","cognome":"Moretti","telefono":"340 4444444","costo_orario":18},
])
for d in dips: print(f"  → {d['nome']} {d['cognome']} (€{d['costo_orario']}/h)")
D = {i: dips[i]["id"] for i in range(len(dips))}

# ─── CATALOGO ──────────────────────────────
print("📦 Inserimento catalogo...")
cats = insert("catalogo", [
    {"nome":"Taglio prato","tipo":"servizio","unita_misura":"mq","prezzo_listino":0.15},
    {"nome":"Potatura siepi","tipo":"servizio","unita_misura":"ml","prezzo_listino":8.00},
    {"nome":"Potatura albero alto fusto","tipo":"servizio","unita_misura":"pz","prezzo_listino":120.00},
    {"nome":"Terra vegetale","tipo":"materiale","unita_misura":"kg","prezzo_listino":0.25},
    {"nome":"Concime granulare","tipo":"materiale","unita_misura":"kg","prezzo_listino":3.50},
    {"nome":"Piantine stagionali","tipo":"materiale","unita_misura":"pz","prezzo_listino":2.80},
    {"nome":"Telo pacciamatura","tipo":"materiale","unita_misura":"mq","prezzo_listino":4.50},
    {"nome":"Irrigazione a goccia","tipo":"servizio","unita_misura":"ml","prezzo_listino":12.00},
    {"nome":"Ghiaia decorativa","tipo":"materiale","unita_misura":"kg","prezzo_listino":0.40},
    {"nome":"Smaltimento verde","tipo":"servizio","unita_misura":"forfait","prezzo_listino":80.00},
])
for ct in cats: print(f"  → {ct['nome']} (€{ct['prezzo_listino']}/{ct['unita_misura']})")
CAT = {i: cats[i]["id"] for i in range(len(cats))}

# ─── PROGETTI ──────────────────────────────
print("📂 Inserimento progetti...")
projs = insert("progetti", [
    {"nome":"Giardino Villa Rossi","cliente_id":C[0],"tipologia":"economia","importo_preventivo":None,"descrizione":"Manutenzione giardino privato 500mq","indirizzo_cantiere":"Via Roma 15, Milano"},
    {"nome":"Potatura alberi alto fusto","cliente_id":C[0],"tipologia":"economia","importo_preventivo":None,"descrizione":"Abbattimento e potatura pini e querce","indirizzo_cantiere":None},
    {"nome":"Manutenzione aree verdi","cliente_id":C[1],"tipologia":"preventivo","importo_preventivo":4800,"descrizione":"Contratto annuale manutenzione condominio","indirizzo_cantiere":"Viale Monza 45, Milano"},
    {"nome":"Nuovo giardino Verdi","cliente_id":C[2],"tipologia":"preventivo","importo_preventivo":8500,"descrizione":"Progettazione e realizzazione giardino 300mq","indirizzo_cantiere":"Via Garibaldi 8, Monza"},
    {"nome":"Parco privato Villa Borghese","cliente_id":C[3],"tipologia":"preventivo","importo_preventivo":15000,"descrizione":"Riqualificazione parco 2000mq con irrigazione","indirizzo_cantiere":"Via Appia 120, Roma"},
    {"nome":"Terrazzo Colombo","cliente_id":C[4],"tipologia":"economia","importo_preventivo":None,"descrizione":"Manutenzione terrazzo con fioriere","indirizzo_cantiere":"Corso Como 22, Milano"},
])
for p in projs: print(f"  → {p['nome']} ({p['tipologia']})")
P = {i: projs[i]["id"] for i in range(len(projs))}

# ─── INTERVENTI ────────────────────────────
print("📋 Inserimento interventi...")

def make_interv(proj_idx, data, note, stato="da_contabilizzare", manod=[], mats=[]):
    iv = insert("interventi", [{"progetto_id": P[proj_idx], "data": data, "note": note, "stato_contabile": stato}])
    if not iv: return
    iid = iv[0]["id"]
    if manod:
        insert("interventi_manodopera", [{"intervento_id": iid, "dipendente_id": D[d], "ore": h, "costo_orario": c} for d,h,c in manod])
    if mats:
        insert("interventi_materiali", [{"intervento_id": iid, "catalogo_id": CAT[ci], "quantita": q, "prezzo_applicato": pr} for ci,q,pr in mats])
    tot_m = sum(h*c for _,h,c in manod)
    tot_mat = sum(q*p for _,q,p in mats)
    print(f"  → {data}: {note[:40]}... (€{tot_m+tot_mat:.0f})")

# Rossi - giardino
make_interv(0, "2026-02-27", "Taglio prato completo + siepi perimetrali",
    manod=[(0,6,25),(1,6,22)], mats=[(4,5,3.50),(9,1,80)])
make_interv(0, "2026-02-22", "Concimazione primaverile prato",
    manod=[(0,4,25)], mats=[(4,20,3.50)])

# Rossi - potatura alberi
make_interv(1, "2026-02-20", "Abbattimento pino secco + potatura quercia", stato="conto_finito",
    manod=[(0,8,25),(1,8,22),(2,8,20)], mats=[(9,2,80)])

# Cond. Aurora
make_interv(2, "2026-02-26", "Taglio prato aree comuni + pulizia aiuole",
    manod=[(1,7,22),(3,7,18)], mats=[(9,1,80)])
make_interv(2, "2026-02-12", "Potatura siepi ingresso + pulizia foglie", stato="fatturato",
    manod=[(1,5,22),(2,5,20)], mats=[(9,1,80)])

# Verdi - nuovo giardino
make_interv(3, "2026-02-25", "Scavo, livellamento terreno e posa telo pacciamatura",
    manod=[(0,8,25),(1,8,22),(2,8,20),(3,8,18)], mats=[(3,500,0.25),(6,100,4.50)])
make_interv(3, "2026-02-27", "Posa piantine + impianto irrigazione",
    manod=[(0,8,25),(2,8,20)], mats=[(5,80,2.80),(7,30,12.00)])

# Villa Borghese
make_interv(4, "2026-02-18", "Rimozione sterpaglie e pulizia area", stato="pagato",
    manod=[(0,8,25),(1,8,22),(2,8,20),(3,8,18)], mats=[(9,3,80)])

# Colombo
make_interv(5, "2026-02-24", "Sostituzione piantine fioriere terrazzo",
    manod=[(3,4,18)], mats=[(5,24,2.80),(3,30,0.25)])

# Futuro
make_interv(0, "2026-03-03", "Programmato: taglio prato mensile",
    manod=[(0,5,25),(1,5,22)])
make_interv(2, "2026-03-05", "Programmato: manutenzione mensile",
    manod=[(1,6,22),(3,6,18)])

# ─── TODO ──────────────────────────────────
print("📝 Inserimento todo...")
insert("todo", [
    {"titolo":"Preventivo recinzione Villa Rossi","descrizione":"Il cliente ha chiesto un preventivo per recinzione lato nord del giardino","priorita":"alta","data_scadenza":"2026-03-01","cliente_id":C[0]},
    {"titolo":"Ordinare piantine per primavera","descrizione":"Contattare vivaio per ordine stagionale: gerani, petunie, surfinie","priorita":"urgente","data_scadenza":"2026-02-28","cliente_id":None},
    {"titolo":"Sopralluogo nuovo cliente zona Brera","descrizione":"Contatto ricevuto per manutenzione terrazzo 80mq","priorita":"media","data_scadenza":"2026-03-05","cliente_id":None},
    {"titolo":"Manutenzione attrezzature","descrizione":"Revisione decespugliatore e affilatura lame tosaerba","priorita":"bassa","data_scadenza":None,"cliente_id":None},
    {"titolo":"Fattura condominio Aurora febbraio","descrizione":"Emettere fattura per lavori di febbraio","priorita":"alta","data_scadenza":"2026-03-10","cliente_id":C[1]},
    {"titolo":"Sopralluogo Verdi per fase 3","descrizione":"Verificare crescita piantine e programmare posa ghiaia","priorita":"media","data_scadenza":"2026-03-15","cliente_id":C[2]},
])
print("  → 6 attività inserite")

print()
print("✅ Seed completato!")
print("   5 clienti, 4 dipendenti, 10 voci catalogo")
print("   6 progetti, 11 interventi, 6 todo")
