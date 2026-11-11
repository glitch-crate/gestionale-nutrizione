# Gestionale Studio Nutrizione

Gestionale per studi di nutrizione: agenda, schede clienti, blocchi di orario, promemoria via
email e un portale dove i clienti prenotano e chiedono di spostare gli appuntamenti.

Tecnologie: Next.js, Supabase (database e login), Vercel (hosting e promemoria giornalieri),
Resend (email).

## Primo avvio

Serve [Node.js](https://nodejs.org) 20.9 o successivo.

1. Installa le dipendenze:
   ```bash
   npm install
   ```
2. Configura il database: apri la cartella con **Claude Code** e scrivi `/installa-database`.
   Claude collega il tuo progetto Supabase e prepara tutto. Per la procedura manuale vedi
   [supabase/README.md](supabase/README.md).
3. Avvia in locale:
   ```bash
   npm run dev
   ```
   - Area studio: http://localhost:3000/login
   - Portale clienti: http://localhost:3000/portale

## Struttura del progetto

```
├── src/
│   ├── app/                      Pagine e route (Next.js App Router): un URL = una cartella
│   │   ├── (studio)/             Area del professionista (dashboard, appuntamenti, calendario,
│   │   │                         clienti, richieste, impostazioni)
│   │   ├── portale/              Portale clienti: accesso, registrazione, password e, in (area)/,
│   │   │                         le pagine riservate (prenota, i-miei-appuntamenti, profilo)
│   │   ├── login/                Accesso del professionista
│   │   ├── privacy/              Informativa privacy pubblica
│   │   └── api/cron/             Promemoria email giornalieri (chiamati da Vercel Cron)
│   │
│   ├── components/               Componenti React, divisi come le route
│   │   ├── studio/               Uno per pagina dell'area studio, più layout/ e auth/
│   │   ├── portale/              Uno per pagina del portale, più layout/ e auth/
│   │   └── shared/               Usati da entrambe le aree (riquadro di accesso, badge di stato,
│   │                             campo password, logout, informativa privacy)
│   │
│   ├── config/
│   │   └── studio.ts             Nome dello studio e dati del titolare (privacy, email)
│   │
│   ├── lib/
│   │   ├── actions/              Server actions: scritture sul database
│   │   │   ├── studio/           Una per pagina (appuntamenti, clienti, calendario, ...)
│   │   │   └── portale/
│   │   ├── queries/              Letture dal database, lato server
│   │   │   ├── studio/
│   │   │   └── portale/
│   │   ├── browser/              Letture fatte dal browser (orari liberi nel portale,
│   │   │                         contatore richieste nello studio)
│   │   ├── auth/session.ts       Chi è collegato (professionista o cliente) e controllo del ruolo
│   │   ├── email/                Email: promemoria del giorno prima, conferme e avvisi di
│   │   │                         prenotazioni e spostamenti (Resend)
│   │   ├── supabase/             Client Supabase (browser, server, service role) e sessione
│   │   ├── format.ts             Formattazione di date e orari per l'interfaccia
│   │   └── timezone.ts           Calcoli su date, fuso orario e orari liberi
│   │
│   ├── types/                    Tipi di dominio condivisi
│   └── proxy.ts                  Middleware: sessione e protezione delle pagine riservate
│
├── supabase/                     Schema completo del database e guida di installazione
├── tests/                        Test (npm test)
├── docs/                         Copia di riferimento dell'informativa privacy (il testo nel sito
│                                 è in components/shared/privacy, con i dati da config/studio.ts)
└── .claude/skills/               Procedura /installa-database per Claude Code
```

Ogni funzionalità ha lo stesso nome in tutte le cartelle. Per esempio, "clienti":

| Cosa | Dove |
|---|---|
| Pagine | `src/app/(studio)/clienti/` |
| Componenti | `src/components/studio/clienti/` |
| Scritture | `src/lib/actions/studio/clienti.ts` |
| Letture | `src/lib/queries/studio/clienti.ts` |
| Tabelle e regole di accesso | `supabase/schema.sql` |

Regole generali:
- **Pagine** (`src/app`): compongono i componenti e chiamano le funzioni di `lib/queries`; non
  contengono query al database.
- **Scritture**: passano sempre da `lib/actions`. Le azioni dello studio verificano per prima cosa
  che l'utente sia un professionista (`lib/auth/session.ts`).
- **Portale clienti**: non legge le tabelle direttamente. Usa le funzioni del database (RPC)
  definite in `supabase/schema.sql`: le letture da `lib/queries/portale` (server) e
  `lib/browser/portale.ts` (browser), le scritture da `lib/actions/portale`, che inviano anche le
  email di conferma.
- **Componenti**: non parlano con il database. Fanno eccezione i form di login, registrazione,
  logout e recupero password, che usano direttamente Supabase Auth.
- **Date e orari**: si salvano in UTC e si mostrano nel fuso dello studio, con i formattatori di
  `lib/format.ts`.

## Adattare il gestionale a un nuovo studio
- **Nome e dati del titolare**: `src/config/studio.ts`. Sono usati nell'interfaccia, nelle email e
  nell'informativa privacy.
- **Orari di apertura e durata delle visite**: dalla pagina Impostazioni del gestionale.
- **Colori**: le variabili in `src/app/globals.css`.
- **Database**: vedi [supabase/README.md](supabase/README.md).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Avvio in sviluppo |
| `npm run build` | Build di produzione, con controllo dei tipi |
| `npm test` | Test |
| `npm run lint` | Lint |

## Pubblicazione
Importa il progetto su Vercel e inserisci le variabili di `.env.local` in Settings > Environment
Variables. Il promemoria giornaliero (ore 8) è già configurato in `vercel.json`.

`vercel.json` fa girare il server a Stoccolma (`"regions": ["arn1"]`), accanto al database
Supabase (regione `eu-north-1`): ogni pagina fa diverse letture al database e la distanza tra i due
pesa su ognuna. Se il progetto Supabase è in un'altra regione, scegli la regione Vercel più vicina.
