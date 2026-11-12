# Gestionale Studio Nutrizione

Gestionale per uno studio di nutrizione (Next.js App Router + Supabase), con due aree:
- **studio**, per il professionista: route in `src/app/(studio)`;
- **portale**, per i clienti: route in `src/app/portale`.

La struttura delle cartelle è spiegata in `README.md` (sezione "Struttura del progetto").
Ogni funzionalità usa lo stesso nome ovunque. Per esempio `clienti`:
`app/(studio)/clienti` → `components/studio/clienti` → `lib/actions/studio/clienti.ts` →
`lib/queries/studio/clienti.ts`. Mantieni questa corrispondenza quando aggiungi file.

## Convenzioni
- Le pagine in `src/app` non contengono query: leggono da `src/lib/queries/<area>/<funzionalità>.ts`.
- Le scritture passano da `src/lib/actions/<area>/<funzionalità>.ts` e restituiscono `ActionResult`
  (`src/types`).
- Le letture fatte dal browser stanno in `src/lib/browser/<area>.ts`. I componenti non chiamano
  Supabase direttamente, tranne i form di autenticazione (Supabase Auth).
- Le email partono solo da `src/lib/email/`, dopo la risposta all'utente (`after()`), e non
  devono mai far fallire l'operazione principale (`trySendEmail`).
- Date e orari si mostrano solo con i formattatori di `src/lib/format.ts`. I calcoli sul fuso
  orario stanno in `src/lib/timezone.ts`.
- Nome dello studio e dati del titolare stanno solo in `src/config/studio.ts`: non vanno scritti a
  mano nei componenti.

## Installazione del database
Se l'utente chiede di installare, configurare o aggiornare il database Supabase, segui la skill
`.claude/skills/installa-database/SKILL.md` (comando `/installa-database`).

## Database di produzione (versione precedente dello schema)
Il progetto Supabase in uso **non** va modificato: il codice è adattato allo schema che c'è già, che
è una versione precedente di `supabase/schema.sql`. Non applicare `schema.sql` né altro SQL di
struttura senza l'approvazione esplicita dell'utente. Differenze di cui il codice tiene conto:
- mancano `get_my_profile`, `get_my_appointments` e `update_my_profile`: il portale legge e
  aggiorna la propria scheda e i propri appuntamenti direttamente dalle tabelle, tramite le policy
  RLS `clients_select_self`, `clients_update_self` e `appointments_select_own_client` (mai la
  colonna `notes`);
- `book_appointment`, `request_reschedule`, `cancel_reschedule_request` e
  `resolve_reschedule_request` restituiscono la riga intera, non un id o un jsonb;
- chi si registra entra subito nel portale con una scheda nuova (`ensure_client_profile`); la
  risposta "Sei già cliente dello studio?" va nei metadati (`is_existing_client`): con "no" e senza
  appuntamenti si può prenotare solo il "Primo incontro" (40 minuti);
- chi era già stato inserito dallo studio con la stessa email viene collegato alla sua scheda da
  `ensureClientProfile()` (`src/lib/auth/session.ts`) **solo se ha confermato l'email con il link**
  (`emailProvedByLink`). Non togliere questo controllo: con la conferma dell'email disattivata in
  Supabase chiunque potrebbe registrarsi con l'email di un altro e prendersi la sua scheda.
Le regole qui sotto descrivono lo schema di `schema.sql`; dove il database di produzione è diverso,
vale quanto scritto in questa sezione.

## Regole di sicurezza del progetto
- Lo schema del database è **solo** in `supabase/schema.sql`, che è idempotente. Ogni modifica al
  database si fa lì, in modo che si possa rieseguire su installazioni esistenti senza perdere dati.
- Il cliente del portale non ha accesso diretto alle tabelle: legge e scrive solo tramite le
  funzioni RPC `security definer` dello schema. Non aggiungere policy RLS che diano ai clienti
  accesso diretto a `clients`, `appointments` o `appointment_types`.
- Ogni server action in `src/lib/actions/studio/` inizia con `getProfessionalClient()`
  (`src/lib/auth/session.ts`).
- La chiave service role si usa solo in `src/lib/supabase/service.ts`, che è `server-only`.
- Gli errori mostrati all'utente sono generici; i dettagli vanno solo nei log del server.

## Sistema di design
Prima di qualsiasi scelta visiva leggi `DESIGN.md`: font, colori, spazi, componenti, movimento e
tono dei testi sono definiti lì. Non discostarti senza l'approvazione esplicita dell'utente e, se
cambi una regola, aggiorna `DESIGN.md` insieme al codice.
