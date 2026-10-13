# IlCammino — Demo funzionante

Applicazione HTML autonoma per dimostrare il flusso dell’ambulatorio: **pazienti**, **visite**, **consensi privacy**, **report** e **audit log**.

## Cosa include

| Elemento | Dettaglio |
|----------|-----------|
| UI | HTML + CSS + JS, interfaccia in italiano |
| Database | **SQLite in-browser** tramite [sql.js](https://sql.js.org/) (WASM locale in `vendor/`) |
| Dati | Seed fittizio (10 pazienti, visite, consensi) |
| Persistenza | `localStorage` (le modifiche restano tra i refresh) |
| Reset | Pulsante «Reset dati demo» |

> Non è il prodotto finale (Next.js + PostgreSQL + 2FA). È un **prototipo navigabile** allineato al modello dati del progetto.

## Condivisione con il cliente (consigliata)

**Non** mandare un IP locale (`http://192.168.…:8765`): AVG e altri antivirus lo marcano spesso come «non sicuro» (HTTP senza certificato).

Usa un URL **HTTPS**:

1. **GitHub Pages** — workflow `.github/workflows/deploy-demo.yml` (dopo push su `main`)
2. **Netlify Drop** — trascina la cartella `demo/` su [app.netlify.com/drop](https://app.netlify.com/drop) e ottieni subito `https://….netlify.app`

Dettagli e workaround AVG: [`docs/CONDIVISIONE_DEMO.md`](../docs/CONDIVISIONE_DEMO.md)

## Avvio in locale (solo sviluppo)

Serve un server HTTP locale (sql.js carica un file WASM; `file://` può fallire).

Dalla cartella del progetto (PowerShell):

```powershell
Set-Location demo
python -m http.server 8765
```

Poi apri nel browser: [http://localhost:8765](http://localhost:8765)

In alternativa:

```bash
npx --yes serve demo -p 8765
```

## Sezioni

1. **Dashboard** — KPI, avvisi consensi, prossime visite  
2. **Pazienti** — ricerca, scheda, creazione/modifica (+ consenso privacy in creazione)  
3. **Visite** — elenco, filtri, completa/annulla, nuova visita  
4. **Consensi** — carica allegato, modifica, rinnovo, revoca  
5. **Report** — mensile, annuale, privacy, per tipologia progetto + export CSV  
6. **Audit log** — ultime azioni registrate  
7. **Guida** — risposte operative alle domande della demo  

### Domande coperte dalla demo

| Domanda | Dove dimostrarlo |
|---------|------------------|
| Caricare privacy di un nuovo utente | Pazienti → Nuovo (+ spunta consenso) oppure Consensi → Carica consenso |
| Rinnovare / modificare anagrafica e privacy | Pazienti → Modifica; Consensi → Modifica / Rinnova / Revoca |
| Quali report (routine vs progetto) | Report: quattro schede preset + esempi in Guida |

## File

```
demo/
  index.html   # interfaccia
  styles.css   # tema sanitario (teal / blu)
  db.js        # schema SQL, seed, query
  app.js       # logica UI
  README.md
```

## Note

- Richiede rete al primo caricamento (CDN sql.js + font Google).  
- I codici fiscali e i dati anagrafici sono **inventati** a scopo dimostrativo.
