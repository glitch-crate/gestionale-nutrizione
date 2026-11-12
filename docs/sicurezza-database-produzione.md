# Sicurezza del database di produzione: verifiche da fare

Il codice del gestionale non ha falle note: ogni azione dello studio verifica il professionista,
la chiave service role resta sul server, non ci sono segreti nel repository e le dipendenze non hanno
vulnerabilità note (`npm audit`). I punti qui sotto riguardano il **database di produzione**, che usa
una versione precedente di `supabase/schema.sql` (vedi `CLAUDE.md`). Vanno verificati nella dashboard
Supabase da chi gestisce il progetto. Nessuna modifica va applicata senza averla provata prima.

## 1. Il cliente legge le tabelle direttamente (priorità alta)
Nel database di produzione il portale legge e modifica `clients` e `appointments` tramite le policy
RLS `clients_select_self`, `clients_update_self` e `appointments_select_own_client`.

Le policy RLS filtrano le **righe**, non le **colonne**. Il codice del portale chiede solo le colonne
giuste, ma il token del cliente è nel suo browser: con quel token chiunque può chiamare l'API di
Supabase direttamente. Quindi un cliente potrebbe:

- **leggere le note interne dello studio** sui propri appuntamenti (`appointments.notes`) e sulla
  propria scheda (`clients.notes`);
- **modificare campi riservati della propria scheda**, per esempio `is_existing_client` (per
  prenotare visite non previste per i nuovi clienti), `notes`, `email`.

Per capire se il rischio è reale, esegui nell'SQL Editor:

```sql
-- Le policy sulle due tabelle e chi possono riguardare
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('clients', 'appointments');

-- Trigger che potrebbero già bloccare le modifiche ai campi riservati
select event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public' and event_object_table in ('clients', 'appointments');
```

Se `clients_update_self` permette `update` senza un trigger che blocchi i campi riservati, o se
`appointments_select_own_client` esiste e la tabella ha la colonna `notes`, il rischio è reale.

**Correzione consigliata:** usare le funzioni RPC di `supabase/schema.sql` (`get_my_profile`,
`get_my_appointments`, `update_my_profile`), che restituiscono e modificano solo i campi permessi, e
togliere le tre policy. Richiede di applicare lo schema e di far tornare il portale alle RPC.

**Correzione minima** (solo modifiche alla scheda, la lettura delle note resta da risolvere):

```sql
create or replace function private.guard_client_self_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.professionals p where p.auth_user_id = auth.uid()) then
    return new; -- il professionista può modificare tutto
  end if;
  if new.notes is distinct from old.notes
     or new.is_existing_client is distinct from old.is_existing_client
     or new.email is distinct from old.email
     or new.studio_id is distinct from old.studio_id
     or new.auth_user_id is distinct from old.auth_user_id then
    raise exception 'Campo non modificabile';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_client_self_update on public.clients;
create trigger trg_guard_client_self_update
  before update on public.clients
  for each row execute function private.guard_client_self_update();
```

## 2. Registrazione senza conferma dell'email (priorità media)
Con "Confirm email" spento chiunque può creare account senza dimostrare di possedere l'email, e non
c'è un CAPTCHA. Una persona malintenzionata potrebbe creare molti account e prenotare un
appuntamento con ciascuno, occupando l'agenda.

- Attiva il CAPTCHA in Supabase > Authentication > Attack Protection (Cloudflare Turnstile o
  hCaptcha). Il modulo di registrazione andrà adattato per inviare il token.
- Controlla i limiti in Supabase > Authentication > Rate Limits.
- Appena possibile configura un SMTP (per esempio Resend) e riattiva la conferma dell'email.

Il collegamento automatico alla scheda inserita dallo studio resta sicuro: avviene solo se l'email
è stata confermata con il link (`emailProvedByLink` in `src/lib/auth/session.ts`).

## 3. "Sei già cliente dello studio?" (priorità bassa)
La risposta è data dal cliente stesso e finisce in `is_existing_client`: chi risponde "sì" può
prenotare anche le visite riservate ai clienti già seguiti. Se è un problema, lo studio può
confermare i nuovi clienti a mano (interruttore "cliente già seguito" nella scheda) e la
registrazione può salvare la risposta solo come informazione.
