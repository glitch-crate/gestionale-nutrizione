---
name: installa-database
description: Installa o aggiorna il database Supabase del Gestionale Studio Nutrizione sul progetto Supabase dell'utente, crea lo studio e il professionista, compila .env.local e verifica che tutto funzioni. Usare quando l'utente chiede di installare, configurare, collegare o aggiornare il database, o di preparare il gestionale al primo avvio.
---

# Installazione del database

Guidi il proprietario dello studio, che di solito non è un tecnico, a configurare il **suo**
progetto Supabase. Parla in italiano semplice, un passo alla volta, e aspetta la sua conferma
quando un passo tocca a lui. Lo schema completo è in `supabase/schema.sql`; il contesto è in
`supabase/README.md`.

## Regole

- Non stampare mai in chat chiavi o segreti (service role key, CRON_SECRET, API key). Scrivili
  direttamente in `.env.local` oppure chiedi all'utente di incollarli lui nel file.
- Non eseguire mai SQL distruttivo (`drop table`, `truncate`, `delete`) sul database dell'utente.
  `schema.sql` è idempotente e non cancella dati: è l'unico SQL di struttura da applicare.
- Scegli il progetto Supabase solo dopo che l'utente lo ha confermato per nome.
- Se il database contiene già dati dei clienti, prima di applicare lo schema chiedi di fare un
  backup (Dashboard > Database > Backups) e aspetta la conferma.

## Passi

### 1. Collegamento a Supabase
Verifica di avere gli strumenti MCP di Supabase (per esempio `list_projects`, `apply_migration`,
`execute_sql`). Se mancano, spiega all'utente come collegarli: su claude.ai/desktop con il
connettore **Supabase** nelle impostazioni dei connettori, oppure da terminale con

```bash
claude mcp add --transport http supabase https://mcp.supabase.com/mcp
```

seguito dal login. Se non è possibile, passa alla **procedura manuale** in fondo.

### 2. Scelta del progetto
Elenca i progetti (`list_projects`) e chiedi quale usare. Se non ne ha uno, fagli creare un
progetto nuovo su supabase.com (regione EU, per esempio Frankfurt o Ireland) e ricomincia.

Poi controlla cosa c'è dentro con `list_tables` (schema `public`):
- **vuoto**: è un'installazione nuova;
- **ci sono già `clients`, `appointments` e simili**: è un aggiornamento. Lo schema mantiene i dati
  e sostituisce funzioni e regole di accesso. Chiedi prima il backup;
- **ci sono altre tabelle non del gestionale**: avvisa che è meglio un progetto dedicato e chiedi
  come procedere.

### 3. Applicare lo schema
Leggi `supabase/schema.sql` per intero e applicalo con `apply_migration`
(nome: `gestionale_schema`). Se fallisce, mostra l'errore all'utente in parole semplici e non
provare correzioni improvvisate sul suo database. Fermati e spiega.

Poi esegui `get_advisors` di tipo `security` e riferisci gli avvisi rilevanti.

### 4. Account del professionista
Chiedi: email del professionista, nome e cognome, nome dello studio. Poi fai creare l'utente
all'utente stesso, perché la password non deve passare da te:

> Dashboard Supabase > Authentication > Users > **Add user** > **Create new user**: inserisci
> email e password e spunta **Auto Confirm User**.

Quando conferma, esegui con `execute_sql`, raddoppiando gli apostrofi nei valori:

```sql
select private.bootstrap_studio('email@esempio.it', 'Nome Cognome', 'Nome dello studio');
```

Crea lo studio con orari di partenza (lun–ven 9–13 e 14–18) e i due tipi di appuntamento,
"Primo incontro" da 45 minuti e "Controllo" da 20. Tutto si cambia poi da **Impostazioni**
nel gestionale. Si può rieseguire senza duplicare nulla.

### 4b. Dati dello studio nel codice
Apri `src/config/studio.ts` e chiedi all'utente i dati da mostrare nel sito, nelle email e
nell'informativa privacy:
- nome dello studio;
- nome del titolare;
- forma giuridica;
- indirizzo;
- P.IVA/C.F.;
- email e telefono del titolare, e i recapiti da mostrare ai clienti nel portale (`contact`);
- email su cui ricevere gli avvisi di nuove prenotazioni e richieste di spostamento
  (`notificationsEmail`);
- data dell'informativa.

Sostituisci i valori presenti con i suoi: quelli attuali appartengono a un altro studio e non
devono restare. Ricordagli di far verificare il testo dell'informativa privacy
(`src/components/shared/privacy/PrivacyContent.tsx`) da chi segue gli aspetti legali.

### 5. Impostazioni di Supabase Auth (le fa l'utente nella dashboard)
Dai i link diretti, `https://supabase.com/dashboard/project/<ref>/auth/...`, e chiedi conferma
per ciascuno:
1. **Sign In / Providers > Email**: "Confirm email" **attivo** (serve per riconoscere i clienti
   già esistenti in modo sicuro); lunghezza minima password **8** o più.
2. **URL Configuration**: Site URL = indirizzo del sito (es. `https://studiorossi.it`); in
   Redirect URLs aggiungere `https://studiorossi.it/**` e `http://localhost:3000/**`.
3. **Emails > Reset password**: il testo deve contenere `{{ .Token }}`, perché il portale chiede il
   codice numerico ricevuto via email. Esempio: "Il tuo codice per reimpostare la password è
   {{ .Token }}".
4. **Emails > SMTP Settings**: consigliato un SMTP personalizzato (per esempio Resend), perché
   quello predefinito di Supabase invia pochissime email all'ora.

### 6. File `.env.local`
- `NEXT_PUBLIC_SUPABASE_URL`: da `get_project_url`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: da `get_publishable_keys` (chiave anon o publishable).
- `SUPABASE_SERVICE_ROLE_KEY`: chiedi all'utente di copiarla lui da Project Settings > API Keys
  e incollarla nel file. Non chiederla in chat.
- `CRON_SECRET`: generalo e scrivilo nel file senza mostrarlo:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `RESEND_API_KEY` e `RESEND_FROM`: servono per tutte le email (promemoria, conferme di
  prenotazione, avvisi allo studio). Richiedono un account Resend e un dominio verificato. Senza,
  il gestionale funziona ma non invia email: dillo chiaramente all'utente.

Parti da `.env.local.example`. Se `.env.local` esiste già, aggiorna solo le righe necessarie.

### 7. Verifica
- Con `execute_sql`: `select count(*) from public.studios; select count(*) from public.professionals;
  select name, duration_minutes, audience from public.appointment_types;` mostra 1 studio,
  1 professionista e i 2 tipi.
- `npm install` e poi `npm run build`, che deve terminare senza errori.
- Proponi `npm run dev`: l'utente entra da `http://localhost:3000/login` con l'account del
  professionista e prova una registrazione cliente da `/portale/registrati`.

### 8. Pubblicazione (se l'utente la chiede)
Su Vercel vanno inserite le stesse variabili di `.env.local` (Settings > Environment Variables).
Il promemoria giornaliero è già configurato in `vercel.json`. Ricorda di aggiornare Site URL e
Redirect URLs di Supabase con il dominio definitivo.

In `vercel.json` la regione del server (`regions`) deve essere vicina a quella del progetto
Supabase (vedi `get_project`): per esempio `arn1` per `eu-north-1`, `fra1` per `eu-central-1`,
`dub1` per `eu-west-1`. Se sono lontane, ogni pagina diventa sensibilmente più lenta.

## Procedura manuale (senza MCP)
1. Supabase > **SQL Editor** > incolla tutto `supabase/schema.sql` > Run.
2. Crea l'utente del professionista come al passo 4, poi esegui nell'SQL Editor la query
   `select private.bootstrap_studio(...)`.
3. Prosegui dal passo 5.
