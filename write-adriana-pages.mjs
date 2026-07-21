import fs from "node:fs/promises";
import path from "node:path";

const root = String.raw`C:\Users\Iván Salamanca\Documents\Visual Studio Code\TypeScript\Adriana\adriana-app`;

const sql = String.raw`-- Adriana Supabase production reconstruction
-- Idempotent rebuild for an existing project.
-- Run this complete file in the Supabase SQL Editor as project owner.
-- RLS avoids direct self-recursive policies by routing membership checks through SECURITY DEFINER helpers.

begin;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create schema if not exists app;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema app to service_role;

create or replace function app.require_user_id()
returns uuid
language plpgsql
stable
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  return v_user_id;
end;
$$;

create or replace function app.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app.normalize_invitation_code(p_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^a-zA-Z0-9]', '', 'g'));
$$;

create or replace function app.generate_invitation_code()
returns text
language plpgsql
volatile
as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (
      select 1
      from public.invitations i
      where i.code = v_code
        and coalesce(i.used, false) = false
        and (i.expires_at is null or i.expires_at > now())
    );
  end loop;
  return v_code;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  locale text not null default 'es',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists timezone text not null default 'UTC';
alter table public.profiles add column if not exists locale text not null default 'es';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  anniversary_date date,
  invite_code text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.couples add column if not exists name text;
alter table public.couples add column if not exists anniversary_date date;
alter table public.couples add column if not exists invite_code text;
alter table public.couples add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.couples add column if not exists created_at timestamptz not null default now();
alter table public.couples add column if not exists updated_at timestamptz not null default now();

create table if not exists public.couple_members (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

alter table public.couple_members add column if not exists role text not null default 'member';
alter table public.couple_members add column if not exists status text not null default 'active';
alter table public.couple_members add column if not exists joined_at timestamptz not null default now();
alter table public.couple_members add column if not exists created_at timestamptz not null default now();
update public.couple_members set role = coalesce(role, 'member'), status = coalesce(status, 'active'), joined_at = coalesce(joined_at, created_at, now());

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  code text not null unique,
  used boolean not null default false,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.invitations add column if not exists used boolean not null default false;
alter table public.invitations add column if not exists used_by uuid references public.profiles(id) on delete set null;
alter table public.invitations add column if not exists used_at timestamptz;
alter table public.invitations add column if not exists expires_at timestamptz;
alter table public.invitations add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.invitations add column if not exists created_at timestamptz not null default now();
update public.invitations set code = app.normalize_invitation_code(code), used = coalesce(used, false);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  location text,
  event_type text not null default 'date',
  color text not null default '#e11d48',
  all_day boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists starts_at timestamptz;
alter table public.events add column if not exists ends_at timestamptz;
alter table public.events add column if not exists location text;
alter table public.events add column if not exists event_type text not null default 'date';
alter table public.events add column if not exists color text not null default '#e11d48';
alter table public.events add column if not exists all_day boolean not null default false;
alter table public.events add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.events add column if not exists created_at timestamptz not null default now();
alter table public.events add column if not exists updated_at timestamptz not null default now();
update public.events set starts_at = coalesce(starts_at, created_at, now()) where starts_at is null;

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  name text not null,
  description text,
  cover_photo_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.albums add column if not exists description text;
alter table public.albums add column if not exists cover_photo_id uuid;
alter table public.albums add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.albums add column if not exists created_at timestamptz not null default now();
alter table public.albums add column if not exists updated_at timestamptz not null default now();

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  album_id uuid references public.albums(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  public_url text,
  caption text,
  width integer,
  height integer,
  size_bytes bigint,
  mime_type text,
  taken_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.photos add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.photos add column if not exists public_url text;
alter table public.photos add column if not exists width integer;
alter table public.photos add column if not exists height integer;
alter table public.photos add column if not exists size_bytes bigint;
alter table public.photos add column if not exists mime_type text;
alter table public.photos add column if not exists taken_at timestamptz;
alter table public.photos add column if not exists updated_at timestamptz not null default now();
update public.photos p set couple_id = a.couple_id from public.albums a where p.album_id = a.id and p.couple_id is null;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text,
  memory_date date,
  favorite boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memories add column if not exists memory_date date;
alter table public.memories add column if not exists favorite boolean not null default false;
alter table public.memories add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.memories add column if not exists created_at timestamptz not null default now();
alter table public.memories add column if not exists updated_at timestamptz not null default now();
update public.memories set title = coalesce(title, 'Recuerdo sin titulo'), favorite = coalesce(favorite, false);

create table if not exists public.memory_comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_likes (
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (memory_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachment_path text,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active',
  due_date date,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  kind text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table public.notifications add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.notifications add column if not exists kind text not null default 'system';
alter table public.notifications add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.notifications add column if not exists read_at timestamptz;
update public.notifications set title = coalesce(title, 'Notificacion'), read = coalesce(read, false);

create table if not exists public.couple_settings (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  theme text not null default 'rose',
  timezone text not null default 'UTC',
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_notifications boolean not null default true,
  push_notifications boolean not null default true,
  digest_frequency text not null default 'daily',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  bucket_id text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  status text not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.questionnaires add column if not exists status text not null default 'draft';
alter table public.questionnaires add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.questionnaires add column if not exists updated_at timestamptz not null default now();

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid references public.questionnaires(id) on delete cascade,
  question text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.questions add column if not exists created_at timestamptz not null default now();

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  answer text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.answers add column if not exists updated_at timestamptz not null default now();

create table if not exists public.timeline_posts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  body text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.timeline_posts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  purchased boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wishlist_items add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.wishlist_items add column if not exists updated_at timestamptz not null default now();

do $$
begin
  alter table public.couple_members add constraint couple_members_role_check check (role in ('owner', 'member'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.couple_members add constraint couple_members_status_check check (status in ('active', 'left'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.events add constraint events_type_check check (event_type in ('date', 'anniversary', 'reminder', 'travel', 'custom'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.goals add constraint goals_status_check check (status in ('active', 'completed', 'archived'));
exception when duplicate_object then null;
end $$;

create unique index if not exists couples_invite_code_unique on public.couples (invite_code) where invite_code is not null;
create unique index if not exists invitations_code_unique on public.invitations (code);
create index if not exists albums_couple_lower_name_idx on public.albums (couple_id, lower(name));
create index if not exists couple_members_user_id_idx on public.couple_members (user_id);
create index if not exists couple_members_couple_id_idx on public.couple_members (couple_id);
create index if not exists events_couple_starts_idx on public.events (couple_id, starts_at);
create index if not exists events_title_trgm_idx on public.events using gin (title gin_trgm_ops);
create index if not exists albums_couple_created_idx on public.albums (couple_id, created_at desc);
create index if not exists photos_couple_created_idx on public.photos (couple_id, created_at desc);
create index if not exists photos_album_created_idx on public.photos (album_id, created_at desc);
create index if not exists memories_couple_created_idx on public.memories (couple_id, created_at desc);
create index if not exists memories_title_trgm_idx on public.memories using gin (title gin_trgm_ops);
create index if not exists memory_comments_memory_created_idx on public.memory_comments (memory_id, created_at);
create index if not exists messages_couple_created_idx on public.messages (couple_id, created_at desc);
create index if not exists goals_couple_status_idx on public.goals (couple_id, status, created_at desc);
create index if not exists checklist_goal_position_idx on public.checklist_items (goal_id, position);
create index if not exists notifications_user_read_idx on public.notifications (user_id, read, created_at desc);
create index if not exists files_couple_created_idx on public.files (couple_id, created_at desc);
create index if not exists questionnaires_couple_created_idx on public.questionnaires (couple_id, created_at desc);
create index if not exists timeline_posts_couple_created_idx on public.timeline_posts (couple_id, created_at desc);
create index if not exists wishlist_items_couple_created_idx on public.wishlist_items (couple_id, created_at desc);

create or replace function app.is_couple_member(p_couple_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select coalesce(exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = p_couple_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
  ), false);
$$;

create or replace function app.can_read_profile(p_profile_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select p_profile_id = p_user_id
    or exists (
      select 1
      from public.couple_members mine
      join public.couple_members theirs on theirs.couple_id = mine.couple_id
      where mine.user_id = p_user_id
        and mine.status = 'active'
        and theirs.user_id = p_profile_id
        and theirs.status = 'active'
    );
$$;

create or replace function app.owns_memory(p_memory_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select coalesce(exists (
    select 1
    from public.memories m
    join public.couple_members cm on cm.couple_id = m.couple_id
    where m.id = p_memory_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
  ), false);
$$;

create or replace function app.owns_goal(p_goal_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, app
as $$
  select coalesce(exists (
    select 1
    from public.goals g
    join public.couple_members cm on cm.couple_id = g.couple_id
    where g.id = p_goal_id
      and cm.user_id = p_user_id
      and cm.status = 'active'
  ), false);
$$;

create or replace function app.storage_path_couple_id(p_name text)
returns uuid
language plpgsql
stable
as $$
declare
  v_first_segment text;
begin
  v_first_segment := split_part(coalesce(p_name, ''), '/', 1);
  if v_first_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_first_segment::uuid;
  end if;
  return null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_couple_with_invitation(
  p_anniversary_date date default null,
  p_display_name text default null
)
returns table(couple_id uuid, invitation_code text)
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_user_id uuid := app.require_user_id();
  v_code text;
  v_existing_couple_id uuid;
begin
  insert into public.profiles (id, display_name)
  values (v_user_id, nullif(trim(p_display_name), ''))
  on conflict (id) do update set
    display_name = coalesce(nullif(trim(p_display_name), ''), public.profiles.display_name),
    updated_at = now();

  select cm.couple_id into v_existing_couple_id
  from public.couple_members cm
  where cm.user_id = v_user_id and cm.status = 'active'
  order by cm.created_at desc
  limit 1;

  if v_existing_couple_id is not null then
    select i.code into v_code
    from public.invitations i
    where i.couple_id = v_existing_couple_id
      and i.used = false
      and (i.expires_at is null or i.expires_at > now())
    order by i.created_at desc
    limit 1;

    if v_code is null then
      v_code := app.generate_invitation_code();
      insert into public.invitations (couple_id, code, created_by, expires_at)
      values (v_existing_couple_id, v_code, v_user_id, now() + interval '30 days');
    end if;

    couple_id := v_existing_couple_id;
    invitation_code := v_code;
    return next;
    return;
  end if;

  v_code := app.generate_invitation_code();

  insert into public.couples (anniversary_date, invite_code, created_by)
  values (p_anniversary_date, v_code, v_user_id)
  returning id into couple_id;

  insert into public.couple_members (couple_id, user_id, role, status)
  values (couple_id, v_user_id, 'owner', 'active');

  insert into public.couple_settings (couple_id) values (couple_id) on conflict do nothing;
  insert into public.invitations (couple_id, code, created_by, expires_at)
  values (couple_id, v_code, v_user_id, now() + interval '30 days');

  invitation_code := v_code;
  return next;
end;
$$;

create or replace function public.join_couple_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_user_id uuid := app.require_user_id();
  v_invitation public.invitations%rowtype;
  v_member_count integer;
begin
  insert into public.profiles (id) values (v_user_id) on conflict do nothing;
  insert into public.user_settings (user_id) values (v_user_id) on conflict do nothing;

  select * into v_invitation
  from public.invitations i
  where i.code = app.normalize_invitation_code(p_code)
    and i.used = false
    and (i.expires_at is null or i.expires_at > now())
  order by i.created_at desc
  limit 1;

  if v_invitation.id is null then
    raise exception 'Codigo de invitacion invalido o expirado' using errcode = '22023';
  end if;

  select count(*) into v_member_count
  from public.couple_members cm
  where cm.couple_id = v_invitation.couple_id and cm.status = 'active';

  if v_member_count >= 2 and not exists (
    select 1 from public.couple_members cm
    where cm.couple_id = v_invitation.couple_id and cm.user_id = v_user_id
  ) then
    raise exception 'Esta pareja ya tiene dos miembros' using errcode = '22023';
  end if;

  insert into public.couple_members (couple_id, user_id, role, status)
  values (v_invitation.couple_id, v_user_id, 'member', 'active')
  on conflict (couple_id, user_id) do update set status = 'active', joined_at = now();

  update public.invitations
  set used = true, used_by = v_user_id, used_at = now()
  where id = v_invitation.id;

  insert into public.notifications (user_id, couple_id, title, body, kind)
  select cm.user_id, v_invitation.couple_id, 'Nueva conexion', 'Tu pareja se unio al espacio.', 'couple_joined'
  from public.couple_members cm
  where cm.couple_id = v_invitation.couple_id and cm.user_id <> v_user_id;

  return v_invitation.couple_id;
end;
$$;

create or replace function public.create_invitation()
returns text
language plpgsql
security definer
set search_path = public, app
as $$
declare
  v_user_id uuid := app.require_user_id();
  v_couple_id uuid;
  v_code text := app.generate_invitation_code();
begin
  select cm.couple_id into v_couple_id
  from public.couple_members cm
  where cm.user_id = v_user_id and cm.status = 'active'
  order by cm.created_at desc
  limit 1;

  if v_couple_id is null then
    raise exception 'No active couple found' using errcode = '22023';
  end if;

  insert into public.invitations (couple_id, code, created_by, expires_at)
  values (v_couple_id, v_code, v_user_id, now() + interval '30 days');

  update public.couples set invite_code = v_code, updated_at = now() where id = v_couple_id;
  return v_code;
end;
$$;

create or replace function public.get_my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.couple_id
  from public.couple_members cm
  where cm.user_id = auth.uid() and cm.status = 'active'
  order by cm.created_at desc
  limit 1;
$$;

create or replace function public.get_dashboard_summary()
returns jsonb
language sql
stable
security definer
set search_path = public, app
as $$
  with mine as (
    select public.get_my_couple_id() as couple_id
  ), members as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url
    ) order by cm.created_at), '[]'::jsonb) as items
    from mine
    join public.couple_members cm on cm.couple_id = mine.couple_id and cm.status = 'active'
    join public.profiles p on p.id = cm.user_id
  ), counts as (
    select jsonb_build_object(
      'events', (select count(*) from public.events e, mine where e.couple_id = mine.couple_id),
      'memories', (select count(*) from public.memories m, mine where m.couple_id = mine.couple_id),
      'photos', (select count(*) from public.photos ph, mine where ph.couple_id = mine.couple_id),
      'goals', (select count(*) from public.goals g, mine where g.couple_id = mine.couple_id and g.status = 'active'),
      'unread_notifications', (select count(*) from public.notifications n where n.user_id = auth.uid() and n.read = false)
    ) as item
  )
  select jsonb_build_object(
    'couple_id', mine.couple_id,
    'members', members.items,
    'counts', counts.item
  )
  from mine, members, counts;
$$;

create or replace view public.dashboard_overview
with (security_invoker = true)
as
select
  c.id as couple_id,
  c.name,
  c.anniversary_date,
  c.created_at,
  c.updated_at,
  coalesce(jsonb_agg(distinct jsonb_build_object(
    'id', p.id,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url
  )) filter (where p.id is not null), '[]'::jsonb) as members
from public.couples c
left join public.couple_members cm on cm.couple_id = c.id and cm.status = 'active'
left join public.profiles p on p.id = cm.user_id
group by c.id;

create or replace function app.set_photo_couple_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.couple_id is null and new.album_id is not null then
    select a.couple_id into new.couple_id from public.albums a where a.id = new.album_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_photo_couple_id on public.photos;
create trigger set_photo_couple_id
before insert or update of album_id, couple_id on public.photos
for each row execute function app.set_photo_couple_id();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles for each row execute function app.touch_updated_at();
drop trigger if exists touch_couples_updated_at on public.couples;
create trigger touch_couples_updated_at before update on public.couples for each row execute function app.touch_updated_at();
drop trigger if exists touch_events_updated_at on public.events;
create trigger touch_events_updated_at before update on public.events for each row execute function app.touch_updated_at();
drop trigger if exists touch_albums_updated_at on public.albums;
create trigger touch_albums_updated_at before update on public.albums for each row execute function app.touch_updated_at();
drop trigger if exists touch_photos_updated_at on public.photos;
create trigger touch_photos_updated_at before update on public.photos for each row execute function app.touch_updated_at();
drop trigger if exists touch_memories_updated_at on public.memories;
create trigger touch_memories_updated_at before update on public.memories for each row execute function app.touch_updated_at();
drop trigger if exists touch_memory_comments_updated_at on public.memory_comments;
create trigger touch_memory_comments_updated_at before update on public.memory_comments for each row execute function app.touch_updated_at();
drop trigger if exists touch_goals_updated_at on public.goals;
create trigger touch_goals_updated_at before update on public.goals for each row execute function app.touch_updated_at();
drop trigger if exists touch_checklist_items_updated_at on public.checklist_items;
create trigger touch_checklist_items_updated_at before update on public.checklist_items for each row execute function app.touch_updated_at();
drop trigger if exists touch_couple_settings_updated_at on public.couple_settings;
create trigger touch_couple_settings_updated_at before update on public.couple_settings for each row execute function app.touch_updated_at();
drop trigger if exists touch_user_settings_updated_at on public.user_settings;
create trigger touch_user_settings_updated_at before update on public.user_settings for each row execute function app.touch_updated_at();
drop trigger if exists touch_questionnaires_updated_at on public.questionnaires;
create trigger touch_questionnaires_updated_at before update on public.questionnaires for each row execute function app.touch_updated_at();
drop trigger if exists touch_answers_updated_at on public.answers;
create trigger touch_answers_updated_at before update on public.answers for each row execute function app.touch_updated_at();
drop trigger if exists touch_timeline_posts_updated_at on public.timeline_posts;
create trigger touch_timeline_posts_updated_at before update on public.timeline_posts for each row execute function app.touch_updated_at();
drop trigger if exists touch_wishlist_items_updated_at on public.wishlist_items;
create trigger touch_wishlist_items_updated_at before update on public.wishlist_items for each row execute function app.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.invitations enable row level security;
alter table public.events enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.memories enable row level security;
alter table public.memory_comments enable row level security;
alter table public.memory_likes enable row level security;
alter table public.messages enable row level security;
alter table public.goals enable row level security;
alter table public.checklist_items enable row level security;
alter table public.notifications enable row level security;
alter table public.couple_settings enable row level security;
alter table public.user_settings enable row level security;
alter table public.files enable row level security;
alter table public.questionnaires enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.timeline_posts enable row level security;
alter table public.wishlist_items enable row level security;

drop policy if exists profiles_select_related on public.profiles;
create policy profiles_select_related on public.profiles for select to authenticated using (app.can_read_profile(id));
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists couples_select_member on public.couples;
create policy couples_select_member on public.couples for select to authenticated using (app.is_couple_member(id));
drop policy if exists couples_update_member on public.couples;
create policy couples_update_member on public.couples for update to authenticated using (app.is_couple_member(id)) with check (app.is_couple_member(id));
drop policy if exists couple_members_select_member on public.couple_members;
create policy couple_members_select_member on public.couple_members for select to authenticated using (user_id = auth.uid() or app.is_couple_member(couple_id));
drop policy if exists invitations_select_member on public.invitations;
create policy invitations_select_member on public.invitations for select to authenticated using (app.is_couple_member(couple_id));
drop policy if exists invitations_insert_member on public.invitations;
create policy invitations_insert_member on public.invitations for insert to authenticated with check (app.is_couple_member(couple_id));
drop policy if exists events_all_member on public.events;
create policy events_all_member on public.events for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists albums_all_member on public.albums;
create policy albums_all_member on public.albums for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists photos_all_member on public.photos;
create policy photos_all_member on public.photos for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists memories_all_member on public.memories;
create policy memories_all_member on public.memories for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists memory_comments_select_member on public.memory_comments;
create policy memory_comments_select_member on public.memory_comments for select to authenticated using (app.owns_memory(memory_id));
drop policy if exists memory_comments_insert_member on public.memory_comments;
create policy memory_comments_insert_member on public.memory_comments for insert to authenticated with check (user_id = auth.uid() and app.owns_memory(memory_id));
drop policy if exists memory_comments_update_own on public.memory_comments;
create policy memory_comments_update_own on public.memory_comments for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists memory_comments_delete_own on public.memory_comments;
create policy memory_comments_delete_own on public.memory_comments for delete to authenticated using (user_id = auth.uid());
drop policy if exists memory_likes_select_member on public.memory_likes;
create policy memory_likes_select_member on public.memory_likes for select to authenticated using (app.owns_memory(memory_id));
drop policy if exists memory_likes_insert_member on public.memory_likes;
create policy memory_likes_insert_member on public.memory_likes for insert to authenticated with check (user_id = auth.uid() and app.owns_memory(memory_id));
drop policy if exists memory_likes_delete_own on public.memory_likes;
create policy memory_likes_delete_own on public.memory_likes for delete to authenticated using (user_id = auth.uid());
drop policy if exists messages_all_member on public.messages;
create policy messages_all_member on public.messages for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id) and sender_id = auth.uid());
drop policy if exists goals_all_member on public.goals;
create policy goals_all_member on public.goals for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists checklist_items_select_member on public.checklist_items;
create policy checklist_items_select_member on public.checklist_items for select to authenticated using (app.owns_goal(goal_id));
drop policy if exists checklist_items_insert_member on public.checklist_items;
create policy checklist_items_insert_member on public.checklist_items for insert to authenticated with check (app.owns_goal(goal_id));
drop policy if exists checklist_items_update_member on public.checklist_items;
create policy checklist_items_update_member on public.checklist_items for update to authenticated using (app.owns_goal(goal_id)) with check (app.owns_goal(goal_id));
drop policy if exists checklist_items_delete_member on public.checklist_items;
create policy checklist_items_delete_member on public.checklist_items for delete to authenticated using (app.owns_goal(goal_id));
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists couple_settings_all_member on public.couple_settings;
create policy couple_settings_all_member on public.couple_settings for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists user_settings_all_own on public.user_settings;
create policy user_settings_all_own on public.user_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists files_all_member on public.files;
create policy files_all_member on public.files for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists questionnaires_all_member on public.questionnaires;
create policy questionnaires_all_member on public.questionnaires for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists questions_select_member on public.questions;
create policy questions_select_member on public.questions for select to authenticated using (exists (select 1 from public.questionnaires q where q.id = questionnaire_id and app.is_couple_member(q.couple_id)));
drop policy if exists questions_write_member on public.questions;
create policy questions_write_member on public.questions for all to authenticated using (exists (select 1 from public.questionnaires q where q.id = questionnaire_id and app.is_couple_member(q.couple_id))) with check (exists (select 1 from public.questionnaires q where q.id = questionnaire_id and app.is_couple_member(q.couple_id)));
drop policy if exists answers_select_member on public.answers;
create policy answers_select_member on public.answers for select to authenticated using (exists (select 1 from public.questions qu join public.questionnaires q on q.id = qu.questionnaire_id where qu.id = question_id and app.is_couple_member(q.couple_id)));
drop policy if exists answers_write_own on public.answers;
create policy answers_write_own on public.answers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists timeline_posts_all_member on public.timeline_posts;
create policy timeline_posts_all_member on public.timeline_posts for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));
drop policy if exists wishlist_items_all_member on public.wishlist_items;
create policy wishlist_items_all_member on public.wishlist_items for all to authenticated using (app.is_couple_member(couple_id)) with check (app.is_couple_member(couple_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('couple-photos', 'couple-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('couple-files', 'couple-files', false, 52428800, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists storage_couple_files_read_member on storage.objects;
create policy storage_couple_files_read_member on storage.objects for select to authenticated using (bucket_id in ('couple-photos', 'couple-files') and app.is_couple_member(app.storage_path_couple_id(name)));
drop policy if exists storage_couple_files_insert_member on storage.objects;
create policy storage_couple_files_insert_member on storage.objects for insert to authenticated with check (bucket_id in ('couple-photos', 'couple-files') and app.is_couple_member(app.storage_path_couple_id(name)));
drop policy if exists storage_couple_files_update_member on storage.objects;
create policy storage_couple_files_update_member on storage.objects for update to authenticated using (bucket_id in ('couple-photos', 'couple-files') and app.is_couple_member(app.storage_path_couple_id(name))) with check (bucket_id in ('couple-photos', 'couple-files') and app.is_couple_member(app.storage_path_couple_id(name)));
drop policy if exists storage_couple_files_delete_member on storage.objects;
create policy storage_couple_files_delete_member on storage.objects for delete to authenticated using (bucket_id in ('couple-photos', 'couple-files') and app.is_couple_member(app.storage_path_couple_id(name)));

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.create_couple_with_invitation(date, text) to authenticated;
grant execute on function public.join_couple_by_code(text) to authenticated;
grant execute on function public.create_invitation() to authenticated;
grant execute on function public.get_my_couple_id() to authenticated;
grant execute on function public.get_dashboard_summary() to authenticated;
revoke all on schema app from anon, authenticated;

commit;
`;

const files = {
  "sql_de_reconstruccion.txt": sql,
  "src/types/supabase.ts": String.raw`export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; avatar_url: string | null; timezone: string; locale: string; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; avatar_url?: string | null; timezone?: string; locale?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; avatar_url?: string | null; timezone?: string; locale?: string; created_at?: string; updated_at?: string };
      };
      couples: {
        Row: { id: string; name: string | null; anniversary_date: string | null; invite_code: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name?: string | null; anniversary_date?: string | null; invite_code?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string | null; anniversary_date?: string | null; invite_code?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
      };
      couple_members: {
        Row: { couple_id: string; user_id: string; role: string; status: string; joined_at: string; created_at: string };
        Insert: { couple_id: string; user_id: string; role?: string; status?: string; joined_at?: string; created_at?: string };
        Update: { couple_id?: string; user_id?: string; role?: string; status?: string; joined_at?: string; created_at?: string };
      };
      events: {
        Row: { id: string; couple_id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; location: string | null; event_type: string; color: string; all_day: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; title: string; description?: string | null; starts_at: string; ends_at?: string | null; location?: string | null; event_type?: string; color?: string; all_day?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; title?: string; description?: string | null; starts_at?: string; ends_at?: string | null; location?: string | null; event_type?: string; color?: string; all_day?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
      };
      memories: {
        Row: { id: string; couple_id: string; title: string; description: string | null; memory_date: string | null; favorite: boolean; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; title: string; description?: string | null; memory_date?: string | null; favorite?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; title?: string; description?: string | null; memory_date?: string | null; favorite?: boolean; created_by?: string | null; created_at?: string; updated_at?: string };
      };
      photos: {
        Row: { id: string; couple_id: string | null; album_id: string | null; uploaded_by: string | null; storage_path: string; public_url: string | null; caption: string | null; width: number | null; height: number | null; size_bytes: number | null; mime_type: string | null; taken_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id?: string | null; album_id?: string | null; uploaded_by?: string | null; storage_path: string; public_url?: string | null; caption?: string | null; width?: number | null; height?: number | null; size_bytes?: number | null; mime_type?: string | null; taken_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string | null; album_id?: string | null; uploaded_by?: string | null; storage_path?: string; public_url?: string | null; caption?: string | null; width?: number | null; height?: number | null; size_bytes?: number | null; mime_type?: string | null; taken_at?: string | null; created_at?: string; updated_at?: string };
      };
      messages: {
        Row: { id: string; couple_id: string; sender_id: string; body: string; attachment_path: string | null; edited_at: string | null; created_at: string };
        Insert: { id?: string; couple_id: string; sender_id: string; body: string; attachment_path?: string | null; edited_at?: string | null; created_at?: string };
        Update: { id?: string; couple_id?: string; sender_id?: string; body?: string; attachment_path?: string | null; edited_at?: string | null; created_at?: string };
      };
      goals: {
        Row: { id: string; couple_id: string; title: string; description: string | null; status: string; due_date: string | null; completed_at: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; title: string; description?: string | null; status?: string; due_date?: string | null; completed_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; title?: string; description?: string | null; status?: string; due_date?: string | null; completed_at?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
      };
      checklist_items: {
        Row: { id: string; goal_id: string; title: string; completed: boolean; position: number; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; goal_id: string; title: string; completed?: boolean; position?: number; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; goal_id?: string; title?: string; completed?: boolean; position?: number; created_by?: string | null; created_at?: string; updated_at?: string };
      };
      albums: {
        Row: { id: string; couple_id: string; name: string; description: string | null; cover_photo_id: string | null; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; couple_id: string; name: string; description?: string | null; cover_photo_id?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; couple_id?: string; name?: string; description?: string | null; cover_photo_id?: string | null; created_by?: string | null; created_at?: string; updated_at?: string };
      };
    };
    Views: { dashboard_overview: { Row: { couple_id: string; name: string | null; anniversary_date: string | null; created_at: string; updated_at: string; members: Json } } };
    Functions: {
      create_couple_with_invitation: { Args: { p_anniversary_date?: string | null; p_display_name?: string | null }; Returns: { couple_id: string; invitation_code: string }[] };
      join_couple_by_code: { Args: { p_code: string }; Returns: string };
      create_invitation: { Args: Record<PropertyKey, never>; Returns: string };
      get_my_couple_id: { Args: Record<PropertyKey, never>; Returns: string | null };
      get_dashboard_summary: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: Record<PropertyKey, never>;
    CompositeTypes: Record<PropertyKey, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
`,
  "src/types/domain.ts": String.raw`import type { Tables } from "./supabase";

export type Profile = Tables<"profiles">;
export type Couple = Tables<"couples">;
export type Event = Tables<"events">;
export type Memory = Tables<"memories">;
export type Message = Tables<"messages">;
export type Goal = Tables<"goals">;
export type ChecklistItem = Tables<"checklist_items">;
export type Album = Tables<"albums">;
export type PhotoRecord = Tables<"photos">;

export type Photo = PhotoRecord & { url: string };

export type DashboardCounts = {
  events: number;
  memories: number;
  photos: number;
  goals: number;
};

export type CoupleSummary = {
  couple: Couple | null;
  nextEvent: Event | null;
  recentMemories: Memory[];
  recentPhotos: Photo[];
  counts: DashboardCounts;
};

export type GoalWithChecklist = Goal & {
  checklist_items: ChecklistItem[];
};
`,
  "src/types/dashboard.ts": String.raw`export type { Event, Memory, Photo, CoupleSummary, DashboardCounts, GoalWithChecklist } from "./domain";
`,
  "src/services/supabase.ts": String.raw`import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
`,
  "src/services/helpers.ts": String.raw`import { supabase } from "@/services/supabase";

export function getErrorMessage(error: unknown, fallback = "Ocurrio un error inesperado") {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

export async function requireCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Necesitas iniciar sesion.");
  return data.user.id;
}

export function normalizeInviteCode(code: string) {
  return code.replace(/[^a-z0-9]/gi, "").toUpperCase();
}
`,
  "src/services/couples.ts": String.raw`import { supabase } from "@/services/supabase";
import { normalizeInviteCode } from "@/services/helpers";

export async function createCouple(anniversaryDate?: string | null, displayName?: string | null) {
  const { data, error } = await supabase.rpc("create_couple_with_invitation", {
    p_anniversary_date: anniversaryDate ?? null,
    p_display_name: displayName ?? null,
  });

  if (error) throw error;
  const result = data.at(0);
  if (!result) throw new Error("No se pudo crear la pareja.");
  return result.invitation_code;
}

export async function joinCouple(code: string) {
  const inviteCode = normalizeInviteCode(code);
  if (!inviteCode) throw new Error("Ingresa un codigo de invitacion.");

  const { data, error } = await supabase.rpc("join_couple_by_code", {
    p_code: inviteCode,
  });

  if (error) throw error;
  return data;
}

export async function createInvitation() {
  const { data, error } = await supabase.rpc("create_invitation");
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, displayName?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
      },
    },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getMyCouple() {
  const { data, error } = await supabase.rpc("get_my_couple_id");
  if (error) return null;
  return data;
}
`,
  "src/services/dashboard.ts": String.raw`import { supabase } from "@/services/supabase";
import { requireCurrentUserId } from "@/services/helpers";
import type { Couple, CoupleSummary, Event, Memory, Photo } from "@/types/domain";

const emptyCounts = { events: 0, memories: 0, photos: 0, goals: 0 };

async function attachPhotoUrls(rows: Omit<Photo, "url">[]): Promise<Photo[]> {
  if (rows.length === 0) return [];

  const { data } = await supabase.storage
    .from("couple-photos")
    .createSignedUrls(rows.map((photo) => photo.storage_path), 60 * 60);

  return rows.map((photo, index) => ({
    ...photo,
    url: photo.public_url || data?.[index]?.signedUrl || "",
  }));
}

export async function getMyCoupleId() {
  const { data, error } = await supabase.rpc("get_my_couple_id");
  if (error) throw error;
  return data;
}

export async function getCouple(coupleId: string) {
  const { data, error } = await supabase.from("couples").select("*").eq("id", coupleId).single();
  if (error) throw error;
  return data;
}

export async function updateCouple(coupleId: string, values: Partial<Pick<Couple, "name" | "anniversary_date">>) {
  const { data, error } = await supabase.from("couples").update(values).eq("id", coupleId).select("*").single();
  if (error) throw error;
  return data;
}

export async function getNextEvent(coupleId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("couple_id", coupleId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRecentMemories(coupleId: string, limit = 5) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getRecentPhotos(coupleId: string, limit = 6) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachPhotoUrls(data ?? []);
}

export async function getDashboardData(coupleId: string): Promise<CoupleSummary> {
  const [couple, nextEvent, memories, photos, eventsCount, memoriesCount, photosCount, goalsCount] = await Promise.all([
    getCouple(coupleId),
    getNextEvent(coupleId),
    getRecentMemories(coupleId),
    getRecentPhotos(coupleId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("memories").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("goals").select("id", { count: "exact", head: true }).eq("couple_id", coupleId).eq("status", "active"),
  ]);

  return {
    couple,
    nextEvent,
    recentMemories: memories,
    recentPhotos: photos,
    counts: {
      events: eventsCount.count ?? emptyCounts.events,
      memories: memoriesCount.count ?? emptyCounts.memories,
      photos: photosCount.count ?? emptyCounts.photos,
      goals: goalsCount.count ?? emptyCounts.goals,
    },
  };
}

export async function listEvents(coupleId: string) {
  const { data, error } = await supabase.from("events").select("*").eq("couple_id", coupleId).order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(coupleId: string, input: Pick<Event, "title" | "description" | "starts_at" | "location">) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("events").insert({ ...input, couple_id: coupleId, created_by: userId }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listMemories(coupleId: string) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("memory_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMemory(coupleId: string, input: Pick<Memory, "title" | "description" | "memory_date">) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("memories").insert({ ...input, couple_id: coupleId, created_by: userId }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listPhotos(coupleId: string) {
  const { data, error } = await supabase.from("photos").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  return attachPhotoUrls(data ?? []);
}

export async function uploadPhoto(coupleId: string, file: File, caption: string) {
  const userId = await requireCurrentUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = coupleId + "/" + crypto.randomUUID() + "-" + safeName;

  const { error: uploadError } = await supabase.storage.from("couple-photos").upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("photos")
    .insert({ couple_id: coupleId, uploaded_by: userId, storage_path: storagePath, caption: caption.trim() || null, mime_type: file.type || null, size_bytes: file.size })
    .select("*")
    .single();
  if (error) throw error;
  const [photo] = await attachPhotoUrls([data]);
  return photo;
}

export async function listMessages(coupleId: string) {
  const { data, error } = await supabase.from("messages").select("*").eq("couple_id", coupleId).order("created_at", { ascending: true }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(coupleId: string, body: string) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("messages").insert({ couple_id: coupleId, sender_id: userId, body }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listGoals(coupleId: string) {
  const { data, error } = await supabase.from("goals").select("*, checklist_items(*)").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGoal(coupleId: string, title: string, description: string) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("goals")
    .insert({ couple_id: coupleId, title, description: description.trim() || null, created_by: userId })
    .select("*, checklist_items(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function toggleGoal(goalId: string, complete: boolean) {
  const { data, error } = await supabase
    .from("goals")
    .update({ status: complete ? "completed" : "active", completed_at: complete ? new Date().toISOString() : null })
    .eq("id", goalId)
    .select("*, checklist_items(*)")
    .single();
  if (error) throw error;
  return data;
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

console.log(`Wrote ${Object.keys(files).length} core files`);


//Second script

import fs from "node:fs/promises";
import path from "node:path";

const root = String.raw`C:\Users\Iván Salamanca\Documents\Visual Studio Code\TypeScript\Adriana\adriana-app`;

const files = {
  "src/pages/auth/login.tsx": String.raw`import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "@/services/couples";
import { getErrorMessage } from "@/services/helpers";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";

export default function Login() {
  const navigate = useNavigate();
  const initAuth = useAuthStore((state) => state.init);
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await signIn(email, password);
      if (authError) throw authError;
      await initAuth();
      await fetchCouple();
      navigate("/", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo iniciar sesion."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Iniciar sesion</h1>
          <p className="mt-1 text-sm text-slate-500">Entra a tu espacio privado.</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <input type="email" placeholder="Correo" className="w-full rounded-lg border border-slate-200 p-3" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input type="password" placeholder="Contrasena" className="w-full rounded-lg border border-slate-200 p-3" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button disabled={loading} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <button type="button" className="w-full text-sm font-medium text-rose-700" onClick={() => navigate("/auth/register")}>
          Crear cuenta
        </button>
      </form>
    </main>
  );
}
`,
  "src/pages/auth/register.tsx": String.raw`import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUp } from "@/services/couples";
import { getErrorMessage } from "@/services/helpers";

export default function Register() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await signUp(email, password, displayName);
      if (authError) throw authError;
      navigate("/auth/login", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la cuenta."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 p-4">
      <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        <div>
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Tu perfil se sincroniza con Supabase.</p>
        </div>
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <input placeholder="Nombre" className="w-full rounded-lg border border-slate-200 p-3" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        <input type="email" placeholder="Correo" className="w-full rounded-lg border border-slate-200 p-3" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <input type="password" placeholder="Contrasena" className="w-full rounded-lg border border-slate-200 p-3" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
        <button disabled={loading} className="w-full rounded-lg bg-slate-950 p-3 font-medium text-white disabled:opacity-60">
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
        <button type="button" className="w-full text-sm font-medium text-rose-700" onClick={() => navigate("/auth/login")}>
          Ya tengo cuenta
        </button>
      </form>
    </main>
  );
}
`,
  "src/pages/onboarding/index.tsx": String.raw`import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCoupleStore } from "@/store/coupleStore";
import CreateCouple from "./CreateCouple";
import JoinCouple from "./JoinCouple";

type Mode = "home" | "create" | "join";

export default function Onboarding() {
  const [mode, setMode] = useState<Mode>("home");
  const coupleId = useCoupleStore((state) => state.coupleId);
  const navigate = useNavigate();

  useEffect(() => {
    if (coupleId) navigate("/dashboard", { replace: true });
  }, [coupleId, navigate]);

  if (coupleId) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-rose-50 p-4">
      <section className="w-full max-w-md rounded-xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        {mode === "home" && (
          <div className="space-y-4">
            <div>
              <h1 className="m-0 text-2xl font-semibold text-slate-950">Configura tu pareja</h1>
              <p className="mt-1 text-sm text-slate-500">Crea un espacio nuevo o unete con un codigo.</p>
            </div>
            <button onClick={() => setMode("create")} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white">Crear pareja</button>
            <button onClick={() => setMode("join")} className="w-full rounded-lg bg-slate-950 p-3 font-medium text-white">Unirme a una pareja</button>
          </div>
        )}
        {mode === "create" && <CreateCouple onBack={() => setMode("home")} />}
        {mode === "join" && <JoinCouple onBack={() => setMode("home")} />}
      </section>
    </main>
  );
}
`,
  "src/pages/onboarding/CreateCouple.tsx": String.raw`import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCouple } from "@/services/couples";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";

export default function CreateCouple({ onBack }: { onBack: () => void }) {
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const navigate = useNavigate();
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const inviteCode = await createCouple(anniversaryDate || null);
      setCode(inviteCode);
      await fetchCouple();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la pareja."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-medium text-slate-500">Volver</button>
      <div>
        <h2 className="m-0 text-xl font-semibold text-slate-950">Crear pareja</h2>
        <p className="mt-1 text-sm text-slate-500">Genera un codigo privado para invitar a tu pareja.</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <input type="date" value={anniversaryDate} onChange={(event) => setAnniversaryDate(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3" />
      {code ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-dashed border-rose-300 bg-rose-50 p-4 text-center font-mono text-2xl font-semibold text-rose-700">{code}</div>
          <button onClick={() => navigate("/dashboard", { replace: true })} className="w-full rounded-lg bg-slate-950 p-3 font-medium text-white">Ir al dashboard</button>
        </div>
      ) : (
        <button onClick={handleCreate} disabled={loading} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">
          {loading ? "Creando..." : "Crear pareja"}
        </button>
      )}
    </div>
  );
}
`,
  "src/pages/onboarding/JoinCouple.tsx": String.raw`import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinCouple } from "@/services/couples";
import { getErrorMessage, normalizeInviteCode } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";

export default function JoinCouple({ onBack }: { onBack: () => void }) {
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      await joinCouple(code);
      await fetchCouple();
      navigate("/dashboard", { replace: true });
    } catch (caught) {
      setError(getErrorMessage(caught, "Codigo invalido."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-sm font-medium text-slate-500">Volver</button>
      <div>
        <h2 className="m-0 text-xl font-semibold text-slate-950">Unirse a pareja</h2>
        <p className="mt-1 text-sm text-slate-500">Ingresa el codigo que recibiste.</p>
      </div>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <input value={code} onChange={(event) => setCode(normalizeInviteCode(event.target.value))} placeholder="CODIGO" className="w-full rounded-lg border border-slate-200 p-3 font-mono uppercase tracking-widest" />
      <button onClick={handleJoin} disabled={loading || !code.trim()} className="w-full rounded-lg bg-slate-950 p-3 font-medium text-white disabled:opacity-60">
        {loading ? "Uniendo..." : "Unirme"}
      </button>
    </div>
  );
}
`,
  "src/pages/calendar/CalendarPage.tsx": String.raw`import { useEffect, useState } from "react";
import { createEvent, listEvents } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { Event } from "@/types/domain";

export default function CalendarPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!coupleId) return;
    setEvents(await listEvents(coupleId));
  }

  useEffect(() => {
    void load();
  }, [coupleId]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!coupleId || !title.trim() || !startsAt) return;
    setLoading(true);
    setError(null);
    try {
      await createEvent(coupleId, {
        title: title.trim(),
        starts_at: new Date(startsAt).toISOString(),
        description: description.trim() || null,
        location: location.trim() || null,
      });
      setTitle("");
      setStartsAt("");
      setDescription("");
      setLocation("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la cita."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Calendario</h1>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" className="w-full rounded-lg border border-slate-200 p-3" required />
          <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3" required />
          <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Lugar" className="w-full rounded-lg border border-slate-200 p-3" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Notas" className="min-h-24 w-full rounded-lg border border-slate-200 p-3" />
          <button disabled={loading} className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white disabled:opacity-60">{loading ? "Guardando..." : "Guardar cita"}</button>
        </form>
        <section className="space-y-3">
          {events.length === 0 ? <p className="rounded-xl bg-white p-5 text-slate-500 shadow-sm ring-1 ring-slate-200">No hay citas registradas.</p> : null}
          {events.map((item) => (
            <article key={item.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-rose-600">{new Date(item.starts_at).toLocaleString()}</p>
              <h2 className="m-0 mt-1 text-lg font-semibold text-slate-950">{item.title}</h2>
              {item.location && <p className="text-sm text-slate-500">{item.location}</p>}
              {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
`,
  "src/pages/gallery/GalleryPage.tsx": String.raw`import { useEffect, useState } from "react";
import { listPhotos, uploadPhoto } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { Photo } from "@/types/domain";

export default function GalleryPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!coupleId) return;
    setPhotos(await listPhotos(coupleId));
  }

  useEffect(() => {
    void load();
  }, [coupleId]);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!coupleId || !file) return;
    setLoading(true);
    setError(null);
    try {
      await uploadPhoto(coupleId, file, caption);
      setCaption("");
      setFile(null);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo subir la foto."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <form onSubmit={handleUpload} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Galeria</h1>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-slate-200 p-3" />
          <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption" className="w-full rounded-lg border border-slate-200 p-3" />
          <button disabled={loading || !file} className="rounded-lg bg-rose-600 px-4 py-3 font-medium text-white disabled:opacity-60">{loading ? "Subiendo..." : "Subir foto"}</button>
        </form>
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img src={photo.url} alt={photo.caption ?? "Foto de pareja"} className="aspect-square w-full object-cover" />
              {photo.caption && <figcaption className="p-3 text-sm text-slate-600">{photo.caption}</figcaption>}
            </figure>
          ))}
        </section>
      </div>
    </main>
  );
}
`,
  "src/pages/memories/MemoriesPage.tsx": String.raw`import { useEffect, useState } from "react";
import { createMemory, listMemories } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { Memory } from "@/types/domain";

export default function MemoriesPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [title, setTitle] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!coupleId) return;
    setMemories(await listMemories(coupleId));
  }

  useEffect(() => {
    void load();
  }, [coupleId]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!coupleId || !title.trim()) return;
    try {
      await createMemory(coupleId, { title: title.trim(), memory_date: memoryDate || null, description: description.trim() || null });
      setTitle("");
      setMemoryDate("");
      setDescription("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo guardar el recuerdo."));
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Recuerdos</h1>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titulo" className="w-full rounded-lg border border-slate-200 p-3" required />
          <input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} className="w-full rounded-lg border border-slate-200 p-3" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Historia" className="min-h-28 w-full rounded-lg border border-slate-200 p-3" />
          <button className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white">Guardar recuerdo</button>
        </form>
        <section className="space-y-3">
          {memories.map((memory) => (
            <article key={memory.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-rose-600">{memory.memory_date ?? "Sin fecha"}</p>
              <h2 className="m-0 mt-1 text-lg font-semibold text-slate-950">{memory.title}</h2>
              {memory.description && <p className="mt-2 text-sm text-slate-600">{memory.description}</p>}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
`,
  "src/pages/messages/MessagesPage.tsx": String.raw`import { useEffect, useState } from "react";
import { listMessages, sendMessage } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import type { Message } from "@/types/domain";

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!coupleId) return;
    setMessages(await listMessages(coupleId));
  }

  useEffect(() => {
    void load();
  }, [coupleId]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!coupleId || !body.trim()) return;
    try {
      await sendMessage(coupleId, body.trim());
      setBody("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo enviar el mensaje."));
    }
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Mensajes</h1>
          {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </section>
        <section className="flex min-h-96 flex-col gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          {messages.map((message) => {
            const own = message.sender_id === user?.id;
            return (
              <div key={message.id} className={own ? "self-end rounded-xl bg-rose-600 px-4 py-2 text-white" : "self-start rounded-xl bg-slate-100 px-4 py-2 text-slate-800"}>
                <p>{message.body}</p>
                <p className={own ? "mt-1 text-xs text-rose-100" : "mt-1 text-xs text-slate-500"}>{new Date(message.created_at).toLocaleString()}</p>
              </div>
            );
          })}
        </section>
        <form onSubmit={handleSend} className="flex gap-2">
          <input value={body} onChange={(event) => setBody(event.target.value)} placeholder="Escribe un mensaje" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-3" />
          <button className="rounded-lg bg-slate-950 px-5 font-medium text-white">Enviar</button>
        </form>
      </div>
    </main>
  );
}
`,
  "src/pages/goals/GoalsPage.tsx": String.raw`import { useEffect, useState } from "react";
import { createGoal, listGoals, toggleGoal } from "@/services/dashboard";
import { getErrorMessage } from "@/services/helpers";
import { useCoupleStore } from "@/store/coupleStore";
import type { GoalWithChecklist } from "@/types/domain";

export default function GoalsPage() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const [goals, setGoals] = useState<GoalWithChecklist[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!coupleId) return;
    setGoals(await listGoals(coupleId));
  }

  useEffect(() => {
    void load();
  }, [coupleId]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!coupleId || !title.trim()) return;
    try {
      await createGoal(coupleId, title.trim(), description);
      setTitle("");
      setDescription("");
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "No se pudo crear la meta."));
    }
  }

  async function handleToggle(goal: GoalWithChecklist) {
    await toggleGoal(goal.id, goal.status !== "completed");
    await load();
  }

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h1 className="m-0 text-2xl font-semibold text-slate-950">Metas</h1>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Meta" className="w-full rounded-lg border border-slate-200 p-3" required />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Detalles" className="min-h-24 w-full rounded-lg border border-slate-200 p-3" />
          <button className="w-full rounded-lg bg-rose-600 p-3 font-medium text-white">Crear meta</button>
        </form>
        <section className="space-y-3">
          {goals.map((goal) => (
            <article key={goal.id} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-slate-950">{goal.title}</h2>
                  {goal.description && <p className="mt-1 text-sm text-slate-600">{goal.description}</p>}
                </div>
                <button onClick={() => void handleToggle(goal)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">
                  {goal.status === "completed" ? "Reabrir" : "Completar"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
`,
  "src/index.css": String.raw`@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/figtree";

@theme inline {
  --font-sans: "Figtree Variable", sans-serif;
}

:root {
  font-family: "Figtree Variable", system-ui, sans-serif;
  color: #0f172a;
  background: #fff1f2;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

#root {
  min-height: 100vh;
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

console.log(`Wrote ${Object.keys(files).length} page files`);

//Third script

import fs from "node:fs/promises";
import path from "node:path";

const root = String.raw`C:\Users\Iván Salamanca\Documents\Visual Studio Code\TypeScript\Adriana\adriana-app`;

const files = {
  "src/services/dashboard.ts": String.raw`import { supabase } from "@/services/supabase";
import { requireCurrentUserId } from "@/services/helpers";
import type { Couple, CoupleSummary, Event, GoalWithChecklist, Memory, Photo } from "@/types/domain";

const emptyCounts = { events: 0, memories: 0, photos: 0, goals: 0 };

async function attachPhotoUrls(rows: Omit<Photo, "url">[]): Promise<Photo[]> {
  if (rows.length === 0) return [];

  const { data } = await supabase.storage
    .from("couple-photos")
    .createSignedUrls(rows.map((photo) => photo.storage_path), 60 * 60);

  return rows.map((photo, index) => ({
    ...photo,
    url: photo.public_url || data?.[index]?.signedUrl || "",
  }));
}

export async function getMyCoupleId() {
  const { data, error } = await supabase.rpc("get_my_couple_id");
  if (error) throw error;
  return data;
}

export async function getCouple(coupleId: string) {
  const { data, error } = await supabase.from("couples").select("*").eq("id", coupleId).single();
  if (error) throw error;
  return data;
}

export async function updateCouple(coupleId: string, values: Partial<Pick<Couple, "name" | "anniversary_date">>) {
  const { data, error } = await supabase.from("couples").update(values).eq("id", coupleId).select("*").single();
  if (error) throw error;
  return data;
}

export async function getNextEvent(coupleId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("couple_id", coupleId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getRecentMemories(coupleId: string, limit = 5) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getRecentPhotos(coupleId: string, limit = 6) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return attachPhotoUrls(data ?? []);
}

export async function getDashboardData(coupleId: string): Promise<CoupleSummary> {
  const [couple, nextEvent, memories, photos, eventsCount, memoriesCount, photosCount, goalsCount] = await Promise.all([
    getCouple(coupleId),
    getNextEvent(coupleId),
    getRecentMemories(coupleId),
    getRecentPhotos(coupleId),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("memories").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("photos").select("id", { count: "exact", head: true }).eq("couple_id", coupleId),
    supabase.from("goals").select("id", { count: "exact", head: true }).eq("couple_id", coupleId).eq("status", "active"),
  ]);

  return {
    couple,
    nextEvent,
    recentMemories: memories,
    recentPhotos: photos,
    counts: {
      events: eventsCount.count ?? emptyCounts.events,
      memories: memoriesCount.count ?? emptyCounts.memories,
      photos: photosCount.count ?? emptyCounts.photos,
      goals: goalsCount.count ?? emptyCounts.goals,
    },
  };
}

export async function listEvents(coupleId: string) {
  const { data, error } = await supabase.from("events").select("*").eq("couple_id", coupleId).order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(coupleId: string, input: Pick<Event, "title" | "description" | "starts_at" | "location">) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("events").insert({ ...input, couple_id: coupleId, created_by: userId }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listMemories(coupleId: string) {
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("couple_id", coupleId)
    .order("memory_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMemory(coupleId: string, input: Pick<Memory, "title" | "description" | "memory_date">) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("memories").insert({ ...input, couple_id: coupleId, created_by: userId }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listPhotos(coupleId: string) {
  const { data, error } = await supabase.from("photos").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  return attachPhotoUrls(data ?? []);
}

export async function uploadPhoto(coupleId: string, file: File, caption: string) {
  const userId = await requireCurrentUserId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storagePath = coupleId + "/" + crypto.randomUUID() + "-" + safeName;

  const { error: uploadError } = await supabase.storage.from("couple-photos").upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("photos")
    .insert({ couple_id: coupleId, uploaded_by: userId, storage_path: storagePath, caption: caption.trim() || null, mime_type: file.type || null, size_bytes: file.size })
    .select("*")
    .single();
  if (error) throw error;
  const [photo] = await attachPhotoUrls([data]);
  return photo;
}

export async function listMessages(coupleId: string) {
  const { data, error } = await supabase.from("messages").select("*").eq("couple_id", coupleId).order("created_at", { ascending: true }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(coupleId: string, body: string) {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase.from("messages").insert({ couple_id: coupleId, sender_id: userId, body }).select("*").single();
  if (error) throw error;
  return data;
}

export async function listGoals(coupleId: string): Promise<GoalWithChecklist[]> {
  const { data: goals, error } = await supabase.from("goals").select("*").eq("couple_id", coupleId).order("created_at", { ascending: false });
  if (error) throw error;
  if (!goals?.length) return [];

  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("*")
    .in("goal_id", goals.map((goal) => goal.id))
    .order("position", { ascending: true });
  if (itemsError) throw itemsError;

  return goals.map((goal) => ({
    ...goal,
    checklist_items: (items ?? []).filter((item) => item.goal_id === goal.id),
  }));
}

export async function createGoal(coupleId: string, title: string, description: string): Promise<GoalWithChecklist> {
  const userId = await requireCurrentUserId();
  const { data, error } = await supabase
    .from("goals")
    .insert({ couple_id: coupleId, title, description: description.trim() || null, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, checklist_items: [] };
}

export async function toggleGoal(goalId: string, complete: boolean): Promise<GoalWithChecklist> {
  const { data, error } = await supabase
    .from("goals")
    .update({ status: complete ? "completed" : "active", completed_at: complete ? new Date().toISOString() : null })
    .eq("id", goalId)
    .select("*")
    .single();
  if (error) throw error;
  return { ...data, checklist_items: [] };
}
`,
  "src/store/authStore.ts": String.raw`import { create } from "zustand";
import { supabase } from "@/services/supabase";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  init: async () => {
    set({ loading: true });
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      set({ user: null, loading: false, initialized: true });
      return;
    }
    set({ user: data.user, loading: false, initialized: true });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
`,
  "src/store/coupleStore.ts": String.raw`import { create } from "zustand";
import { supabase } from "@/services/supabase";
import { getMyCouple } from "@/services/couples";

type CoupleState = {
  coupleId: string | null;
  loading: boolean;
  error: string | null;
  fetchCouple: () => Promise<void>;
  reset: () => void;
};

export const useCoupleStore = create<CoupleState>((set) => ({
  coupleId: null,
  loading: true,
  error: null,

  fetchCouple: async () => {
    set({ loading: true, error: null });

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      set({ coupleId: null, loading: false });
      return;
    }

    try {
      const coupleId = await getMyCouple();
      set({ coupleId, loading: false });
    } catch (error) {
      set({
        coupleId: null,
        loading: false,
        error: error instanceof Error ? error.message : "No se pudo cargar la pareja.",
      });
    }
  },

  reset: () => set({ coupleId: null, loading: false, error: null }),
}));
`,
  "src/store/dashboardStore.ts": String.raw`import { create } from "zustand";
import { getDashboardData } from "@/services/dashboard";
import type { CoupleSummary } from "@/types/domain";

type DashboardState = {
  summary: CoupleSummary | null;
  loading: boolean;
  error: string | null;
  load: (coupleId: string) => Promise<void>;
  reset: () => void;
};

export const useDashboardStore = create<DashboardState>((set) => ({
  summary: null,
  loading: false,
  error: null,

  load: async (coupleId) => {
    set({ loading: true, error: null });
    try {
      const summary = await getDashboardData(coupleId);
      set({ summary, loading: false });
    } catch (error) {
      set({
        summary: null,
        loading: false,
        error: error instanceof Error ? error.message : "No se pudo cargar el dashboard.",
      });
    }
  },

  reset: () => set({ summary: null, loading: false, error: null }),
}));
`,
  "src/routes/ProtectedRoute.tsx": String.raw`import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useCoupleStore } from "@/store/coupleStore";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const coupleId = useCoupleStore((state) => state.coupleId);

  if (!user) return <Navigate to="/auth/login" replace />;
  if (!coupleId) return <Navigate to="/onboarding" replace />;

  return children;
}
`,
  "src/routes/AppRouter.tsx": String.raw`import { Navigate, Route, Routes } from "react-router-dom";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard/Dashboard";
import CalendarPage from "@/pages/calendar/CalendarPage";
import GalleryPage from "@/pages/gallery/GalleryPage";
import MemoriesPage from "@/pages/memories/MemoriesPage";
import MessagesPage from "@/pages/messages/MessagesPage";
import GoalsPage from "@/pages/goals/GoalsPage";
import ProtectedRoute from "@/routes/ProtectedRoute";

function protectedPage(page: React.ReactNode) {
  return <ProtectedRoute>{page}</ProtectedRoute>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      <Route path="/calendar" element={protectedPage(<CalendarPage />)} />
      <Route path="/gallery" element={protectedPage(<GalleryPage />)} />
      <Route path="/memories" element={protectedPage(<MemoriesPage />)} />
      <Route path="/messages" element={protectedPage(<MessagesPage />)} />
      <Route path="/goals" element={protectedPage(<GoalsPage />)} />
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
`,
  "src/App.tsx": String.raw`import { useEffect, useState } from "react";
import AppRouter from "./routes/AppRouter";
import { useAuthStore } from "./store/authStore";
import { useCoupleStore } from "./store/coupleStore";

function App() {
  const initAuth = useAuthStore((state) => state.init);
  const fetchCouple = useCoupleStore((state) => state.fetchCouple);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        await initAuth();
        await fetchCouple();
      } finally {
        setBooting(false);
      }
    }

    void bootstrap();
  }, [fetchCouple, initAuth]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <p className="text-slate-500">Cargando historia de pareja</p>
      </div>
    );
  }

  return <AppRouter />;
}

export default App;
`,
  "src/pages/dashboard/Dashboard.tsx": String.raw`import { useEffect } from "react";
import { useCoupleStore } from "@/store/coupleStore";
import { useDashboardStore } from "@/store/dashboardStore";
import CoupleHeader from "./components/CoupleHeader";
import DaysTogetherCard from "./components/DaysTogetherCard";
import NextDateCard from "./components/NextDateCard";
import MemoriesPreview from "./components/MemoriesPreview";
import QuickActions from "./components/QuickActions";
import PhotosPreview from "./components/PhotosPreview";

export default function Dashboard() {
  const coupleId = useCoupleStore((state) => state.coupleId);
  const { summary, loading, error, load } = useDashboardStore();

  useEffect(() => {
    if (coupleId) void load(coupleId);
  }, [coupleId, load]);

  if (!coupleId || loading) return <div className="min-h-screen bg-rose-50 p-6 text-slate-500">Cargando pareja...</div>;
  if (error) return <div className="min-h-screen bg-rose-50 p-6 text-red-600">{error}</div>;

  return (
    <main className="min-h-screen bg-rose-50 p-4 text-left sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <CoupleHeader couple={summary?.couple ?? null} counts={summary?.counts} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DaysTogetherCard startDate={summary?.couple?.anniversary_date ?? summary?.couple?.created_at ?? null} />
          <NextDateCard event={summary?.nextEvent ?? null} />
        </div>
        <MemoriesPreview memories={summary?.recentMemories ?? []} />
        <PhotosPreview photos={summary?.recentPhotos ?? []} />
        <QuickActions />
      </div>
    </main>
  );
}
`,
  "src/pages/dashboard/components/CoupleHeader.tsx": String.raw`import type { Couple, DashboardCounts } from "@/types/domain";

type Props = {
  couple: Couple | null;
  counts?: DashboardCounts;
};

export default function CoupleHeader({ couple, counts }: Props) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600">Adriana</p>
          <h1 className="m-0 text-2xl font-semibold text-slate-950">{couple?.name ?? "Nuestra historia"}</h1>
          <p className="mt-1 text-sm text-slate-500">Espacio privado de pareja</p>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          <span><b className="block text-slate-950">{counts?.events ?? 0}</b>Citas</span>
          <span><b className="block text-slate-950">{counts?.memories ?? 0}</b>Recuerdos</span>
          <span><b className="block text-slate-950">{counts?.photos ?? 0}</b>Fotos</span>
          <span><b className="block text-slate-950">{counts?.goals ?? 0}</b>Metas</span>
        </div>
      </div>
    </section>
  );
}
`,
  "src/pages/dashboard/components/DaysTogetherCard.tsx": String.raw`function getDaysTogether(startDate: string | null) {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
}

export default function DaysTogetherCard({ startDate }: { startDate: string | null }) {
  const days = getDaysTogether(startDate);

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-sm font-medium text-slate-500">Dias juntos</h2>
      <p className="mt-3 text-4xl font-semibold text-rose-600">{days}</p>
      <p className="mt-1 text-sm text-slate-500">Calculado desde la fecha de aniversario o creacion.</p>
    </section>
  );
}
`,
  "src/pages/dashboard/components/NextDateCard.tsx": String.raw`import type { Event } from "@/types/dashboard";

export default function NextDateCard({ event }: { event: Event | null }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-sm font-medium text-slate-500">Proxima cita</h2>
      {event ? (
        <div className="mt-3">
          <p className="text-xl font-semibold text-slate-950">{event.title}</p>
          <p className="text-sm text-slate-500">{new Date(event.starts_at).toLocaleString()}</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">No hay citas proximas.</p>
      )}
    </section>
  );
}
`,
  "src/pages/dashboard/components/MemoriesPreview.tsx": String.raw`import type { Memory } from "@/types/dashboard";

export default function MemoriesPreview({ memories }: { memories: Memory[] }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-base font-semibold text-slate-950">Recuerdos recientes</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {memories.length === 0 ? (
          <p className="text-sm text-slate-400">Aun no hay recuerdos.</p>
        ) : (
          memories.map((memory) => (
            <span key={memory.id} className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700">
              {memory.title}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
`,
  "src/pages/dashboard/components/PhotosPreview.tsx": String.raw`import type { Photo } from "@/types/dashboard";

export default function PhotosPreview({ photos }: { photos: Photo[] }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="m-0 text-base font-semibold text-slate-950">Galeria</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.length === 0 ? (
          <p className="col-span-full text-sm text-slate-400">Sin fotos aun.</p>
        ) : (
          photos.map((photo) => (
            <img key={photo.id} src={photo.url} alt={photo.caption ?? "Foto de pareja"} className="aspect-square rounded-lg object-cover ring-1 ring-slate-200" />
          ))
        )}
      </div>
    </section>
  );
}
`,
  "src/pages/dashboard/components/QuickActions.tsx": String.raw`import { CalendarDays, Camera, Goal, HeartHandshake, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "Citas", path: "/calendar", Icon: CalendarDays },
  { label: "Fotos", path: "/gallery", Icon: Camera },
  { label: "Recuerdos", path: "/memories", Icon: HeartHandshake },
  { label: "Mensajes", path: "/messages", Icon: MessageCircle },
  { label: "Metas", path: "/goals", Icon: Goal },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {actions.map(({ label, path, Icon }) => (
        <button key={path} onClick={() => navigate(path)} className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl bg-white text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-700">
          <Icon className="size-5" />
          {label}
        </button>
      ))}
    </section>
  );
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(root, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

console.log(`Wrote ${Object.keys(files).length} ui foundation files`);
