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
