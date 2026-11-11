-- ============================================================
-- Gestionale Studio Nutrizione — schema completo del database
-- ============================================================
-- Un'installazione = uno studio (con il suo professionista) e i
-- suoi clienti. Il file è IDEMPOTENTE: si può eseguire su un
-- progetto Supabase vuoto oppure di nuovo su un database già in uso
-- (aggiorna tabelle, funzioni e policy senza perdere dati).
--
-- Come si usa: vedi supabase/README.md. In breve: eseguire tutto
-- il file nell'SQL Editor (o farlo applicare a Claude), poi creare
-- l'utente del professionista e chiamare private.bootstrap_studio().
--
-- Modello di sicurezza
-- * Il professionista accede alle tabelle del proprio studio
--   direttamente (Row Level Security per studio_id).
-- * Il cliente del portale NON ha alcun accesso diretto alle tabelle
--   clients / appointments / appointment_types: legge e scrive solo
--   tramite le funzioni RPC qui sotto, che restituiscono solo i suoi
--   dati e solo le colonne che può vedere (mai le note dello studio).
-- * L'utente anonimo non ha accesso a nulla.
-- ============================================================

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;

-- Funzioni interne: non esposte dall'API REST di Supabase.
create schema if not exists private;
revoke all on schema private from public;

-- ------------------------------------------------------------
-- TIPI
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'appointment_status' and n.nspname = 'public') then
    create type public.appointment_status as enum ('da_confermare', 'confermato', 'completato', 'annullato');
  end if;
end $$;

-- ------------------------------------------------------------
-- TABELLE
-- ------------------------------------------------------------
create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_professionals_studio on public.professionals (studio_id);

create table if not exists public.studio_settings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null unique references public.studios (id) on delete cascade,
  business_name text not null default 'Studio',
  timezone text not null default 'Europe/Rome',
  default_slot_minutes int not null default 30,
  -- chiave = giorno ISO "1".."7" (lun..dom), valore = [{ "start": "09:00", "end": "13:00" }, ...]
  opening_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.studio_settings add column if not exists opening_hours jsonb not null default '{}'::jsonb;

create table if not exists public.appointment_types (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  name text not null,
  duration_minutes int not null default 30 check (duration_minutes between 5 and 240),
  active boolean not null default true,
  -- a chi è prenotabile dal portale: 'nuovi' (primo incontro),
  -- 'esistenti' (controlli) oppure 'tutti'
  audience text not null default 'tutti' check (audience in ('nuovi', 'esistenti', 'tutti')),
  created_at timestamptz not null default now()
);
alter table public.appointment_types add column if not exists audience text not null default 'tutti';
create index if not exists idx_appointment_types_studio on public.appointment_types (studio_id);
create unique index if not exists idx_appointment_types_name on public.appointment_types (studio_id, name);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  notes text,                                   -- note private dello studio
  is_existing_client boolean not null default false,  -- impostato SOLO dal professionista
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.clients add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table public.clients add column if not exists is_existing_client boolean not null default false;
alter table public.clients add column if not exists privacy_accepted_at timestamptz;
create index if not exists idx_clients_studio on public.clients (studio_id);
create index if not exists idx_clients_search on public.clients (studio_id, last_name, first_name);
create unique index if not exists idx_clients_email_per_studio on public.clients (studio_id, email);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  appointment_type_id uuid not null references public.appointment_types (id) on delete restrict,
  professional_id uuid not null references public.professionals (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'da_confermare',
  notes text,
  created_by text not null default 'professionista' check (created_by in ('professionista', 'cliente')),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  constraint valid_time_range check (ends_at > starts_at)
);
alter table public.appointments add column if not exists created_by text not null default 'professionista';
alter table public.appointments add column if not exists reminder_sent_at timestamptz;
create index if not exists idx_appointments_studio on public.appointments (studio_id);
create index if not exists idx_appointments_professional_time on public.appointments (professional_id, starts_at);
create index if not exists idx_appointments_client on public.appointments (client_id);

-- Due appuntamenti attivi dello stesso professionista non possono
-- sovrapporsi, nemmeno con richieste concorrenti.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'no_overlapping_appointments') then
    alter table public.appointments add constraint no_overlapping_appointments
      exclude using gist (professional_id with =, tstzrange(starts_at, ends_at) with &&)
      where (status <> 'annullato');
  end if;
end $$;

create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  professional_id uuid not null references public.professionals (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint valid_block_range check (ends_at > starts_at)
);
create index if not exists idx_time_blocks_studio_time on public.time_blocks (studio_id, starts_at);

create table if not exists public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios (id) on delete cascade,
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  old_starts_at timestamptz not null,
  new_starts_at timestamptz not null,
  new_ends_at timestamptz not null,
  status text not null default 'in_attesa'
    check (status in ('in_attesa', 'approvata', 'rifiutata', 'annullata', 'scaduta')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.reschedule_requests add column if not exists studio_id uuid references public.studios (id) on delete cascade;
alter table public.reschedule_requests add column if not exists new_ends_at timestamptz;
alter table public.reschedule_requests add column if not exists resolved_at timestamptz;
-- Database già esistenti: completa le colonne aggiunte in questa versione.
update public.reschedule_requests r
set studio_id = a.studio_id,
    new_ends_at = coalesce(r.new_ends_at, r.new_starts_at + (a.ends_at - a.starts_at))
from public.appointments a
where a.id = r.appointment_id and (r.studio_id is null or r.new_ends_at is null);
update public.appointment_types set audience = 'nuovi'
where audience = 'tutti' and lower(name) like 'primo%'
  and not exists (select 1 from public.appointment_types t2 where t2.audience <> 'tutti');
update public.appointment_types set audience = 'esistenti'
where audience = 'tutti' and lower(name) like 'controllo%'
  and not exists (select 1 from public.appointment_types t2 where t2.audience = 'esistenti');

create index if not exists idx_reschedule_studio_status on public.reschedule_requests (studio_id, status);
create index if not exists idx_reschedule_client on public.reschedule_requests (client_id);
-- Al massimo una richiesta in attesa per cliente.
create unique index if not exists idx_reschedule_one_pending
  on public.reschedule_requests (client_id) where status = 'in_attesa';

-- ------------------------------------------------------------
-- FUNZIONI INTERNE (schema private)
-- ------------------------------------------------------------
create or replace function private.my_studio_ids()
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select p.studio_id from public.professionals p where p.auth_user_id = auth.uid();
$$;

create or replace function private.my_client_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.id from public.clients c where c.auth_user_id = auth.uid();
$$;

create or replace function private.is_professional_of(p_studio uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.professionals p
                 where p.auth_user_id = auth.uid() and p.studio_id = p_studio);
$$;

-- Un cliente è "esistente" se lo studio lo ha segnato come tale oppure
-- se ha già avuto almeno un appuntamento. Non è mai autodichiarato.
create or replace function private.client_is_existing(p_client uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select c.is_existing_client from public.clients c where c.id = p_client), false)
      or exists (select 1 from public.appointments a
                 where a.client_id = p_client
                   and a.status in ('confermato', 'completato')
                   and a.starts_at < now());
$$;

-- Tipi di appuntamento che il cliente può prenotare.
create or replace function private.allowed_types(p_client uuid)
returns setof public.appointment_types
language sql stable security definer set search_path = ''
as $$
  select t.*
  from public.appointment_types t
  join public.clients c on c.studio_id = t.studio_id
  where c.id = p_client
    and t.active
    and (t.audience = 'tutti'
         or (t.audience = 'esistenti' and private.client_is_existing(p_client))
         or (t.audience = 'nuovi' and not private.client_is_existing(p_client)))
  order by t.duration_minutes, t.name;
$$;

-- Orari liberi di uno studio tra due date (estremi inclusi), per una
-- durata data. Tiene conto di orari di apertura, appuntamenti attivi,
-- blocchi e orari riservati da richieste di spostamento in attesa.
create or replace function private.free_slots(
  p_studio uuid, p_from date, p_to date, p_duration int, p_exclude_appointment uuid default null)
returns table (slot_start timestamptz, slot_end timestamptz)
language sql stable security definer set search_path = ''
as $$
  with s as (
    select ss.opening_hours, ss.timezone from public.studio_settings ss where ss.studio_id = p_studio
  ),
  days as (
    select g::date as d from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') g
  ),
  wins as (
    select ((days.d + (w ->> 'start')::time) at time zone s.timezone) as ws,
           ((days.d + (w ->> 'end')::time) at time zone s.timezone) as we
    from days
    cross join s
    cross join lateral jsonb_array_elements(
      coalesce(s.opening_hours -> (extract(isodow from days.d)::int)::text, '[]'::jsonb)) w
  ),
  cand as (
    select g as slot_start, g + make_interval(mins => p_duration) as slot_end
    from wins
    cross join lateral generate_series(
      wins.ws, wins.we - make_interval(mins => p_duration), make_interval(mins => least(20, p_duration))) g
  )
  select c.slot_start, c.slot_end
  from cand c
  where c.slot_start > now()
    and not exists (select 1 from public.appointments a
                    where a.studio_id = p_studio and a.status <> 'annullato'
                      and a.id is distinct from p_exclude_appointment
                      and a.starts_at < c.slot_end and a.ends_at > c.slot_start)
    and not exists (select 1 from public.time_blocks b
                    where b.studio_id = p_studio
                      and b.starts_at < c.slot_end and b.ends_at > c.slot_start)
    and not exists (select 1 from public.reschedule_requests r
                    where r.studio_id = p_studio and r.status = 'in_attesa' and r.expires_at > now()
                      and r.new_starts_at < c.slot_end and r.new_ends_at > c.slot_start)
  order by 1;
$$;

-- Coerenza: cliente, tipo e professionista di un appuntamento devono
-- appartenere allo stesso studio dell'appuntamento.
create or replace function private.check_appointment_studio()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.clients where id = new.client_id and studio_id = new.studio_id)
     or not exists (select 1 from public.appointment_types where id = new.appointment_type_id and studio_id = new.studio_id)
     or not exists (select 1 from public.professionals where id = new.professional_id and studio_id = new.studio_id) then
    raise exception 'Dati dell''appuntamento non coerenti con lo studio';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_appointment_studio on public.appointments;
create trigger trg_check_appointment_studio
  before insert or update of studio_id, client_id, appointment_type_id, professional_id on public.appointments
  for each row execute function private.check_appointment_studio();

-- Configurazione iniziale: collega l'utente del professionista (già
-- creato in Authentication > Users) a un nuovo studio, con orari e tipi
-- di appuntamento di partenza. Rieseguibile: aggiorna senza duplicare.
-- Solo per l'amministratore (SQL Editor / Claude), mai dall'app.
create or replace function private.bootstrap_studio(
  p_professional_email text, p_full_name text, p_studio_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
  v_studio uuid;
begin
  select u.id into v_user from auth.users u where lower(u.email) = lower(trim(p_professional_email));
  if v_user is null then
    raise exception 'Nessun utente con email %: crealo prima in Authentication > Users', p_professional_email;
  end if;
  if exists (select 1 from public.clients c where c.auth_user_id = v_user) then
    raise exception 'Questo utente è registrato come cliente: usa un''altra email per il professionista';
  end if;

  select p.studio_id into v_studio from public.professionals p where p.auth_user_id = v_user;
  if v_studio is null then
    select s.id into v_studio from public.studios s order by s.created_at limit 1;
  end if;
  if v_studio is null then
    insert into public.studios (name) values (p_studio_name) returning id into v_studio;
  else
    update public.studios set name = p_studio_name where id = v_studio;
  end if;

  insert into public.studio_settings (studio_id, business_name, opening_hours)
  values (v_studio, p_studio_name,
    '{"1":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],
      "2":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],
      "3":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],
      "4":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],
      "5":[{"start":"09:00","end":"13:00"},{"start":"14:00","end":"18:00"}],
      "6":[],"7":[]}'::jsonb)
  on conflict (studio_id) do update set business_name = excluded.business_name;

  insert into public.appointment_types (studio_id, name, duration_minutes, audience)
  values (v_studio, 'Primo incontro', 45, 'nuovi'),
         (v_studio, 'Controllo', 20, 'esistenti')
  on conflict (studio_id, name) do nothing;

  insert into public.professionals (studio_id, auth_user_id, full_name)
  values (v_studio, v_user, p_full_name)
  on conflict (auth_user_id) do update set full_name = excluded.full_name, studio_id = excluded.studio_id;

  return v_studio;
end;
$$;

-- ------------------------------------------------------------
-- PULIZIA DI VERSIONI PRECEDENTI
-- Rimuove tutte le policy esistenti sulle tabelle dell'app (anche
-- quelle troppo permissive di versioni vecchie) e le vecchie versioni
-- delle funzioni RPC, che vengono ricreate qui sotto.
-- ------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('studios', 'professionals', 'studio_settings', 'appointment_types',
                        'clients', 'appointments', 'time_blocks', 'reschedule_requests')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  for r in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('register_client', 'ensure_client_profile', 'get_available_slots', 'book_appointment',
                        'get_booking_lock', 'get_booking_options', 'get_reschedule_slots', 'request_reschedule',
                        'cancel_reschedule_request', 'resolve_reschedule_request', 'get_my_profile',
                        'update_my_profile', 'get_my_appointments')
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

-- ------------------------------------------------------------
-- RPC DEL PORTALE CLIENTE
-- ------------------------------------------------------------

-- Crea (o collega) la scheda cliente dell'utente autenticato. Restituisce
-- i dati del cliente oppure null se l'utente non è un cliente.
create function public.ensure_client_profile()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_user auth.users%rowtype;
  v_meta jsonb;
  v_client public.clients%rowtype;
  v_studio uuid;
  v_first text; v_last text; v_phone text; v_email text;
begin
  if v_uid is null then
    raise exception 'Non autenticato';
  end if;
  if exists (select 1 from public.professionals where auth_user_id = v_uid) then
    return null;
  end if;

  select * into v_client from public.clients where auth_user_id = v_uid;
  if not found then
    select * into v_user from auth.users where id = v_uid;
    v_meta  := coalesce(v_user.raw_user_meta_data, '{}'::jsonb);
    v_first := left(trim(coalesce(v_meta ->> 'first_name', '')), 100);
    v_last  := left(trim(coalesce(v_meta ->> 'last_name', '')), 100);
    v_phone := left(trim(coalesce(v_meta ->> 'phone', '')), 30);
    v_email := lower(trim(v_user.email));

    if v_first = '' or v_last = '' or v_email is null
       or coalesce(v_meta ->> 'privacy_accepted', '') <> 'true' then
      return null;
    end if;

    select id into v_studio from public.studios order by created_at limit 1;
    if v_studio is null then
      raise exception 'Studio non ancora configurato';
    end if;

    -- Cliente già inserito dallo studio con questa email: lo colleghiamo,
    -- ma solo se l'email è stata verificata (prova che è davvero sua).
    if v_user.email_confirmed_at is not null then
      update public.clients set auth_user_id = v_uid
      where studio_id = v_studio and lower(email) = v_email and auth_user_id is null
      returning * into v_client;
    end if;

    if v_client.id is null then
      if exists (select 1 from public.clients where studio_id = v_studio and lower(email) = v_email) then
        return null;  -- email già usata da un'altra scheda
      end if;
      begin
        insert into public.clients (studio_id, auth_user_id, first_name, last_name, phone, email,
                                    is_existing_client, privacy_accepted_at)
        values (v_studio, v_uid, v_first, v_last, v_phone, v_email, false, now())
        returning * into v_client;
      exception when unique_violation then
        select * into v_client from public.clients where auth_user_id = v_uid;
        if not found then return null; end if;
      end;
    end if;
  end if;

  return jsonb_build_object('id', v_client.id, 'first_name', v_client.first_name,
    'last_name', v_client.last_name, 'phone', v_client.phone, 'email', v_client.email);
end;
$$;

create function public.get_my_profile()
returns table (id uuid, first_name text, last_name text, phone text, email text)
language sql stable security definer set search_path = ''
as $$
  select c.id, c.first_name, c.last_name, c.phone, c.email
  from public.clients c where c.auth_user_id = auth.uid();
$$;

-- Il cliente può modificare solo nome, cognome e telefono.
create function public.update_my_profile(p_first_name text, p_last_name text, p_phone text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_first text := trim(coalesce(p_first_name, ''));
  v_last  text := trim(coalesce(p_last_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
begin
  if v_first = '' or v_last = '' or v_phone = '' then
    raise exception 'Compila tutti i campi';
  end if;
  if char_length(v_first) > 100 or char_length(v_last) > 100 or v_phone !~ '^[0-9 +().-]{5,30}$' then
    raise exception 'Dati non validi';
  end if;
  update public.clients set first_name = v_first, last_name = v_last, phone = v_phone
  where auth_user_id = auth.uid();
  if not found then
    raise exception 'Account cliente non trovato';
  end if;
end;
$$;

create function public.get_my_appointments()
returns table (id uuid, starts_at timestamptz, ends_at timestamptz, status public.appointment_status,
               appointment_type_name text)
language sql stable security definer set search_path = ''
as $$
  select a.id, a.starts_at, a.ends_at, a.status, t.name
  from public.appointments a
  join public.appointment_types t on t.id = a.appointment_type_id
  where a.client_id = private.my_client_id()
  order by a.starts_at desc;
$$;

create function public.get_booking_options()
returns table (name text, duration_minutes int)
language sql stable security definer set search_path = ''
as $$
  select t.name, t.duration_minutes from private.allowed_types(private.my_client_id()) t;
$$;

create function public.get_booking_lock()
returns table (lock_starts_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select a.starts_at from public.appointments a
  where a.client_id = private.my_client_id()
    and a.status in ('da_confermare', 'confermato')
    and a.starts_at > now()
  order by a.starts_at
  limit 1;
$$;

create function public.get_available_slots(p_type_name text, p_from date, p_to date)
returns table (slot_start timestamptz, slot_end timestamptz, duration_minutes int, appointment_type_name text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_client uuid := private.my_client_id();
  v_type public.appointment_types%rowtype;
  v_tz text;
  v_today date;
  v_from date;
  v_to date;
begin
  if v_client is null then
    raise exception 'Account cliente non trovato';
  end if;
  select * into v_type from private.allowed_types(v_client) t
  where p_type_name is null or t.name = p_type_name
  limit 1;
  if not found then
    return;
  end if;

  select ss.timezone into v_tz from public.studio_settings ss where ss.studio_id = v_type.studio_id;
  v_today := (now() at time zone coalesce(v_tz, 'Europe/Rome'))::date;
  v_from := greatest(coalesce(p_from, v_today), v_today);
  v_to := least(coalesce(p_to, v_today + 60), v_today + 61, v_from + 31);
  if v_to < v_from then
    return;
  end if;

  return query
    select f.slot_start, f.slot_end, v_type.duration_minutes, v_type.name
    from private.free_slots(v_type.studio_id, v_from, v_to, v_type.duration_minutes) f;
end;
$$;

create function public.book_appointment(p_starts_at timestamptz, p_type_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_client public.clients%rowtype;
  v_type public.appointment_types%rowtype;
  v_professional uuid;
  v_tz text;
  v_day date;
  v_id uuid;
begin
  select * into v_client from public.clients where auth_user_id = auth.uid();
  if not found then
    raise exception 'Account cliente non trovato';
  end if;

  -- Una prenotazione alla volta per studio: niente doppie prenotazioni concorrenti.
  perform pg_advisory_xact_lock(hashtext(v_client.studio_id::text));

  if exists (select 1 from public.appointments a where a.client_id = v_client.id
             and a.status in ('da_confermare', 'confermato') and a.starts_at > now()) then
    raise exception 'Hai già un appuntamento in programma';
  end if;
  if exists (select 1 from public.reschedule_requests r where r.client_id = v_client.id
             and r.status = 'in_attesa' and r.expires_at > now()) then
    raise exception 'Hai una richiesta di spostamento in attesa';
  end if;

  select * into v_type from private.allowed_types(v_client.id) t
  where p_type_name is null or t.name = p_type_name
  limit 1;
  if not found then
    raise exception 'Tipo di appuntamento non disponibile';
  end if;

  select ss.timezone into v_tz from public.studio_settings ss where ss.studio_id = v_client.studio_id;
  v_day := (p_starts_at at time zone coalesce(v_tz, 'Europe/Rome'))::date;
  if p_starts_at > now() + interval '62 days'
     or not exists (select 1 from private.free_slots(v_client.studio_id, v_day, v_day, v_type.duration_minutes) f
                    where f.slot_start = p_starts_at) then
    raise exception 'Questo orario non è più disponibile';
  end if;

  select p.id into v_professional from public.professionals p
  where p.studio_id = v_client.studio_id order by p.created_at limit 1;
  if v_professional is null then
    raise exception 'Studio non ancora configurato';
  end if;

  begin
    insert into public.appointments (studio_id, client_id, appointment_type_id, professional_id,
                                     starts_at, ends_at, status, created_by)
    values (v_client.studio_id, v_client.id, v_type.id, v_professional,
            p_starts_at, p_starts_at + make_interval(mins => v_type.duration_minutes), 'confermato', 'cliente')
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'Questo orario non è più disponibile';
  end;

  return v_id;
end;
$$;

create function public.get_reschedule_slots(p_appointment_id uuid, p_from date, p_to date)
returns table (slot_start timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_app public.appointments%rowtype;
  v_tz text;
  v_today date;
  v_from date;
  v_to date;
begin
  select * into v_app from public.appointments a
  where a.id = p_appointment_id and a.client_id = private.my_client_id() and a.status = 'confermato';
  if not found then
    return;
  end if;

  select ss.timezone into v_tz from public.studio_settings ss where ss.studio_id = v_app.studio_id;
  v_today := (now() at time zone coalesce(v_tz, 'Europe/Rome'))::date;
  v_from := greatest(coalesce(p_from, v_today), v_today);
  v_to := least(coalesce(p_to, v_today + 60), v_today + 61, v_from + 31);
  if v_to < v_from then
    return;
  end if;

  return query
    select f.slot_start
    from private.free_slots(v_app.studio_id, v_from, v_to,
                            (extract(epoch from (v_app.ends_at - v_app.starts_at)) / 60)::int, v_app.id) f;
end;
$$;

create function public.request_reschedule(p_appointment_id uuid, p_new_starts_at timestamptz)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_client uuid := private.my_client_id();
  v_app public.appointments%rowtype;
  v_minutes int;
  v_tz text;
  v_day date;
  v_id uuid;
begin
  if v_client is null then
    raise exception 'Account cliente non trovato';
  end if;

  select * into v_app from public.appointments a
  where a.id = p_appointment_id and a.client_id = v_client
  for update;
  if not found then
    raise exception 'Appuntamento non trovato';
  end if;
  if v_app.status <> 'confermato' then
    raise exception 'Si possono spostare solo appuntamenti confermati';
  end if;
  if v_app.starts_at - now() < interval '24 hours' then
    raise exception 'Mancano meno di 24 ore all''appuntamento';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_app.studio_id::text));

  update public.reschedule_requests set status = 'scaduta', resolved_at = now()
  where client_id = v_client and status = 'in_attesa' and expires_at <= now();
  if exists (select 1 from public.reschedule_requests where client_id = v_client and status = 'in_attesa') then
    raise exception 'Hai già una richiesta di spostamento in attesa';
  end if;

  v_minutes := (extract(epoch from (v_app.ends_at - v_app.starts_at)) / 60)::int;
  select ss.timezone into v_tz from public.studio_settings ss where ss.studio_id = v_app.studio_id;
  v_day := (p_new_starts_at at time zone coalesce(v_tz, 'Europe/Rome'))::date;
  if p_new_starts_at > now() + interval '62 days'
     or not exists (select 1 from private.free_slots(v_app.studio_id, v_day, v_day, v_minutes, v_app.id) f
                    where f.slot_start = p_new_starts_at) then
    raise exception 'Questo orario non è più disponibile';
  end if;

  insert into public.reschedule_requests (studio_id, appointment_id, client_id, old_starts_at,
                                          new_starts_at, new_ends_at, status, expires_at)
  values (v_app.studio_id, v_app.id, v_client, v_app.starts_at, p_new_starts_at,
          p_new_starts_at + make_interval(mins => v_minutes), 'in_attesa',
          least(now() + interval '48 hours', v_app.starts_at, p_new_starts_at))
  returning id into v_id;

  return v_id;
end;
$$;

create function public.cancel_reschedule_request(p_request_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.reschedule_requests set status = 'annullata', resolved_at = now()
  where id = p_request_id and client_id = private.my_client_id() and status = 'in_attesa';
  if not found then
    raise exception 'Richiesta non trovata';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- RPC DEL PROFESSIONISTA
-- ------------------------------------------------------------
create function public.resolve_reschedule_request(p_request_id uuid, p_approve boolean)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_req public.reschedule_requests%rowtype;
  v_status text;
begin
  select * into v_req from public.reschedule_requests where id = p_request_id for update;
  if not found or not private.is_professional_of(v_req.studio_id) then
    raise exception 'Richiesta non trovata';
  end if;
  if v_req.status <> 'in_attesa' then
    raise exception 'Questa richiesta è già stata gestita';
  end if;

  if v_req.expires_at <= now() then
    update public.reschedule_requests set status = 'scaduta', resolved_at = now() where id = v_req.id;
    return jsonb_build_object('status', 'scaduta');
  end if;

  if p_approve then
    begin
      update public.appointments
      set starts_at = v_req.new_starts_at, ends_at = v_req.new_ends_at
      where id = v_req.appointment_id;
    exception when exclusion_violation then
      raise exception 'Il nuovo orario si sovrappone a un altro appuntamento';
    end;
    v_status := 'approvata';
  else
    v_status := 'rifiutata';
  end if;

  update public.reschedule_requests set status = v_status, resolved_at = now() where id = v_req.id;
  return jsonb_build_object('status', v_status);
end;
$$;

-- ------------------------------------------------------------
-- PERMESSI SULLE FUNZIONI
-- ------------------------------------------------------------
revoke all on all functions in schema private from public;
grant usage on schema private to authenticated, service_role;
-- usate dentro le policy RLS: servono al ruolo authenticated
grant execute on function private.my_studio_ids() to authenticated;
grant execute on function private.my_client_id() to authenticated;
grant execute on function private.is_professional_of(uuid) to authenticated;

do $$
declare f text;
begin
  foreach f in array array[
    'public.ensure_client_profile()',
    'public.get_my_profile()',
    'public.update_my_profile(text, text, text)',
    'public.get_my_appointments()',
    'public.get_booking_options()',
    'public.get_booking_lock()',
    'public.get_available_slots(text, date, date)',
    'public.book_appointment(timestamptz, text)',
    'public.get_reschedule_slots(uuid, date, date)',
    'public.request_reschedule(uuid, timestamptz)',
    'public.cancel_reschedule_request(uuid)',
    'public.resolve_reschedule_request(uuid, boolean)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.studios enable row level security;
alter table public.professionals enable row level security;
alter table public.studio_settings enable row level security;
alter table public.appointment_types enable row level security;
alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.time_blocks enable row level security;
alter table public.reschedule_requests enable row level security;

-- L'utente anonimo non tocca nessuna tabella; i dati passano da RLS.
revoke all on public.studios, public.professionals, public.studio_settings, public.appointment_types,
              public.clients, public.appointments, public.time_blocks, public.reschedule_requests
  from anon;
grant select, insert, update, delete on public.studio_settings, public.appointment_types,
              public.clients, public.appointments, public.time_blocks
  to authenticated;
grant select on public.studios, public.professionals, public.reschedule_requests to authenticated;
revoke insert, update, delete on public.studios, public.professionals, public.reschedule_requests
  from authenticated;
grant all on public.studios, public.professionals, public.studio_settings, public.appointment_types,
             public.clients, public.appointments, public.time_blocks, public.reschedule_requests
  to service_role;

create policy studios_select_professional on public.studios
  for select to authenticated
  using (id in (select private.my_studio_ids()));

create policy professionals_select_self on public.professionals
  for select to authenticated
  using (auth_user_id = (select auth.uid()));

create policy studio_settings_professional on public.studio_settings
  for all to authenticated
  using (studio_id in (select private.my_studio_ids()))
  with check (studio_id in (select private.my_studio_ids()));

create policy appointment_types_professional on public.appointment_types
  for all to authenticated
  using (studio_id in (select private.my_studio_ids()))
  with check (studio_id in (select private.my_studio_ids()));

create policy clients_professional on public.clients
  for all to authenticated
  using (studio_id in (select private.my_studio_ids()))
  with check (studio_id in (select private.my_studio_ids()));

create policy appointments_professional on public.appointments
  for all to authenticated
  using (studio_id in (select private.my_studio_ids()))
  with check (studio_id in (select private.my_studio_ids()));

create policy time_blocks_professional on public.time_blocks
  for all to authenticated
  using (studio_id in (select private.my_studio_ids()))
  with check (studio_id in (select private.my_studio_ids()));

-- Richieste di spostamento: in sola lettura. Il professionista vede
-- quelle del suo studio, il cliente solo le proprie. Le modifiche
-- passano solo dalle funzioni RPC.
create policy reschedule_select on public.reschedule_requests
  for select to authenticated
  using (studio_id in (select private.my_studio_ids())
         or client_id = (select private.my_client_id()));
