-- ============================================================
-- Schema iniziale — Gestionale Studio Nutrizione (MVP)
-- ============================================================
-- Scope MVP confermato: UN solo studio, UN solo professionista.
-- Nessun login cliente in questa fase (rimandato).
--
-- La tabella `studios` esiste già da ora, con una sola riga,
-- per non dover riscrivere lo schema se in futuro si vorrà
-- supportare più studi (SaaS multi-tenant). Ogni tabella "porta"
-- lo studio_id: questo è ciò che rende l'evoluzione futura
-- possibile senza migrazioni distruttive.
--
-- Da eseguire nell'SQL Editor del progetto Supabase.
-- ============================================================

create extension if not exists "btree_gist";

-- ------------------------------------------------------------
-- STUDI
-- ------------------------------------------------------------
create table if not exists studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROFESSIONISTI
-- Collega un utente Supabase Auth a uno studio.
-- ------------------------------------------------------------
create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_professionals_studio on professionals (studio_id);

-- ------------------------------------------------------------
-- IMPOSTAZIONI STUDIO
-- Una riga per studio. Contiene i parametri usati per calcolare
-- gli slot disponibili nel calendario.
-- ------------------------------------------------------------
create table if not exists studio_settings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null unique references studios (id) on delete cascade,
  business_name text not null default 'Studio',
  timezone text not null default 'Europe/Rome',
  default_slot_minutes int not null default 30,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- TIPI DI APPUNTAMENTO
-- ------------------------------------------------------------
create table if not exists appointment_types (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios (id) on delete cascade,
  name text not null,
  duration_minutes int not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointment_types_studio on appointment_types (studio_id);

-- ------------------------------------------------------------
-- CLIENTI
-- Anagrafica minima: nessun dato sanitario, nessuna diagnosi.
-- Nessun collegamento ad auth.users nell'MVP (il cliente non
-- ha un proprio login in questa fase).
-- ------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_studio on clients (studio_id);
create index if not exists idx_clients_search on clients (studio_id, last_name, first_name);
create unique index if not exists idx_clients_email_per_studio on clients (studio_id, email);

-- ------------------------------------------------------------
-- APPUNTAMENTI
-- Il vincolo `no_overlapping_appointments` impedisce, a livello
-- di database, che lo stesso professionista abbia due appuntamenti
-- attivi (non annullati) che si sovrappongono nel tempo — anche
-- in caso di richieste concorrenti.
-- ------------------------------------------------------------
create type appointment_status as enum (
  'da_confermare',
  'confermato',
  'completato',
  'annullato'
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios (id) on delete cascade,
  client_id uuid not null references clients (id) on delete restrict,
  appointment_type_id uuid not null references appointment_types (id) on delete restrict,
  professional_id uuid not null references professionals (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'da_confermare',
  notes text,
  created_at timestamptz not null default now(),
  constraint valid_time_range check (ends_at > starts_at),
  constraint no_overlapping_appointments exclude using gist (
    professional_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status != 'annullato')
);

create index if not exists idx_appointments_studio on appointments (studio_id);
create index if not exists idx_appointments_professional_time on appointments (professional_id, starts_at);
create index if not exists idx_appointments_client on appointments (client_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Principio applicato: un professionista può leggere/scrivere
-- solo le righe che appartengono al proprio studio. Nell'MVP
-- c'è un solo professionista per studio, ma la policy è scritta
-- in modo da restare corretta anche con più professionisti.

alter table studios enable row level security;
alter table professionals enable row level security;
alter table studio_settings enable row level security;
alter table appointment_types enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;

-- Un professionista vede solo il proprio studio
create policy "professionals_select_own_studio"
  on studios for select
  using (
    id in (select studio_id from professionals where auth_user_id = auth.uid())
  );

-- Un professionista vede/gestisce solo il proprio record
create policy "professionals_select_self"
  on professionals for select
  using (auth_user_id = auth.uid());

-- Policy generica riusata per tutte le tabelle "figlie" di uno studio:
-- l'utente deve avere un record in `professionals` con lo stesso
-- studio_id della riga a cui sta cercando di accedere.

create policy "studio_settings_all_own_studio"
  on studio_settings for all
  using (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  )
  with check (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  );

create policy "appointment_types_all_own_studio"
  on appointment_types for all
  using (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  )
  with check (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  );

create policy "clients_all_own_studio"
  on clients for all
  using (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  )
  with check (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  );

create policy "appointments_all_own_studio"
  on appointments for all
  using (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  )
  with check (
    studio_id in (select studio_id from professionals where auth_user_id = auth.uid())
  );

-- ============================================================
-- DATI INIZIALI DI ESEMPIO (fittizi, da eseguire una sola volta)
-- ============================================================
-- Dopo aver creato il primo utente in Supabase Auth (dashboard
-- Supabase > Authentication > Add user), esegui questo blocco
-- sostituendo l'UUID con quello del nuovo utente:
--
-- insert into studios (id, name) values
--   ('11111111-1111-1111-1111-111111111111', 'Studio Nutrizione Demo');
--
-- insert into studio_settings (studio_id, business_name) values
--   ('11111111-1111-1111-1111-111111111111', 'Studio Nutrizione Demo');
--
-- insert into professionals (studio_id, auth_user_id, full_name) values
--   ('11111111-1111-1111-1111-111111111111', '<AUTH_USER_ID_QUI>', 'Nome Cognome');

-- ============================================================
-- AGGIORNAMENTO — Portale cliente (self-service, sola prenotazione)
-- ============================================================
-- Le migrazioni sotto sono già state applicate al progetto Supabase
-- reale tramite il connettore MCP. Questo file resta il riferimento
-- "sorgente di verità" dello schema, per chi volesse ricreare il
-- database da zero (es. un ambiente di staging separato in futuro).
--
-- Novità:
-- * clients.auth_user_id — collega (facoltativamente) un cliente
--   a un account Supabase Auth, per l'accesso al portale.
-- * studio_settings.opening_hours — orari di apertura configurabili
--   (chiave = giorno ISO 1-7, valore = elenco di fasce orarie).
-- * appointments.created_by — 'professionista' oppure 'cliente'.
-- * Due tipi di appuntamento con durate diverse: "Primo incontro"
--   (45 min, per chi non ha mai avuto un appuntamento) e "Controllo"
--   (20 min, per i clienti con almeno un appuntamento pregresso).
-- * Funzioni: register_client(), get_available_slots(), book_appointment()
--   — vedi il file delle migrazioni Supabase per il codice completo.
--   Il cliente NON può mai cancellare o spostare un appuntamento:
--   solo il professionista ha questo privilegio (nessuna policy di
--   UPDATE/DELETE concessa ai clienti su `appointments`).
