-- ============================================================
-- NTX Command Center — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helpers ──────────────────────────────────────────────────
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Companies ────────────────────────────────────────────────
create table if not exists companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  domain        text,
  industry      text,
  city          text,
  country       text default 'Perú',
  ruc           text,
  phone         text,
  owner         text,
  lifecycle     text default 'Lead',
  lead_status   text default 'New',
  avatar_color  text,
  custom_fields jsonb default '{}',
  created_at    timestamptz default now(),
  last_activity timestamptz default now()
);

-- Run these if tables already exist:
-- alter table contacts add column if not exists custom_fields jsonb default '{}';
-- alter table companies add column if not exists custom_fields jsonb default '{}';
alter table companies enable row level security;

-- ── Contacts ─────────────────────────────────────────────────
create table if not exists contacts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text,
  phone               text,
  role                text,
  company_id          uuid references companies(id) on delete set null,
  lead_status         text default 'New',
  preferred_channels  text,
  topics              text,
  notes               text,
  avatar_color        text,
  custom_fields       jsonb default '{}',
  created_at          timestamptz default now(),
  last_activity       timestamptz default now()
);
alter table contacts enable row level security;

-- ── Extend profiles with contact_id (after contacts table exists) ──
alter table profiles add column if not exists contact_id uuid references contacts(id) on delete set null;

-- ── Deals ────────────────────────────────────────────────────
create table if not exists deals (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  company_id    uuid references companies(id) on delete set null,
  contact_ids   uuid[] default '{}',
  stage         text default 'new',
  amount        numeric default 0,
  currency      text default 'USD',
  close_date    date,
  pipeline      text default 'Sales Pipeline',
  type          text default 'New Business',
  priority      text default 'Medium',
  owner         text,
  activities    jsonb default '[]',
  created_at    timestamptz default now(),
  last_activity timestamptz default now()
);
alter table deals enable row level security;

-- ── Projects ─────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company_id  uuid references companies(id) on delete set null,
  contact_id  uuid references contacts(id) on delete set null,
  framework   text,
  value       numeric default 0,
  currency    text default 'USD',
  phase       text default 'kickoff',
  server_id   uuid,
  phases      jsonb default '{}',
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
alter table projects enable row level security;

-- ── Conversations (chat threads per client) ───────────────────
create table if not exists conversations (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies(id) on delete cascade,
  contact_id    uuid references contacts(id) on delete set null,
  last_message  text,
  last_at       timestamptz default now(),
  unread_admin  int default 0,
  unread_client int default 0,
  created_at    timestamptz default now()
);
alter table conversations enable row level security;

-- ── Messages ─────────────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id       uuid references auth.users(id) on delete set null,
  from_role       text not null check (from_role in ('admin', 'client')),
  text            text not null,
  created_at      timestamptz default now()
);
alter table messages enable row level security;

-- ── Contracts ────────────────────────────────────────────────
create table if not exists contracts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  company_id          uuid references companies(id) on delete set null,
  contact_id          uuid references contacts(id) on delete set null,
  party_type          text default 'Contrato',
  status              text default 'draft',
  expiry_date         date,
  sent_at             text,
  client_signed_at    text,
  nithrox_signed_at   text,
  pdf_url             text,
  pdf_name            text,
  data                jsonb default '{}',
  created_at          timestamptz default now()
);
alter table contracts enable row level security;

-- ── Proposals ────────────────────────────────────────────────
create table if not exists proposals (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  company_id  uuid references companies(id) on delete set null,
  contact_id  uuid references contacts(id) on delete set null,
  status      text default 'draft' check (status in ('draft','sent','viewed','accepted','rejected')),
  amount      numeric default 0,
  currency    text default 'USD',
  content     jsonb default '{}',
  views       int default 0,
  accepted    boolean default false,
  created_at  timestamptz default now()
);
alter table proposals enable row level security;

-- ── Forms ────────────────────────────────────────────────────
create table if not exists forms (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  fields      jsonb default '[]',
  status      text default 'draft' check (status in ('draft','active','closed')),
  views       int default 0,
  created_at  timestamptz default now()
);
alter table forms enable row level security;

create table if not exists form_responses (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid references forms(id) on delete cascade not null,
  data        jsonb default '{}',
  submitted_at timestamptz default now()
);
alter table form_responses enable row level security;

-- ── Documents ────────────────────────────────────────────────
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        text,
  url         text,
  project_id  uuid references projects(id) on delete set null,
  company_id  uuid references companies(id) on delete set null,
  uploaded_by uuid references auth.users(id) on delete set null,
  size        bigint default 0,
  created_at  timestamptz default now()
);
alter table documents enable row level security;

-- ── Notifications ────────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  type        text,
  icon        text,
  title       text not null,
  body        text,
  link        text,
  read        boolean default false,
  created_at  timestamptz default now()
);
alter table notifications enable row level security;

-- ── Portals ──────────────────────────────────────────────────
create table if not exists portals (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  contact_id  uuid references contacts(id) on delete cascade,
  project_id  uuid references projects(id) on delete cascade,
  active      boolean default true,
  created_at  timestamptz default now()
);
alter table portals enable row level security;

-- ── Servers ──────────────────────────────────────────────────
create table if not exists servers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text,
  ip            text,
  plan          text,
  provider      text,
  status        text default 'online',
  cpu           numeric default 0,
  ram           numeric default 0,
  disk          numeric default 0,
  sites         int default 0,
  monthly_cost  numeric default 0,
  currency      text default 'USD',
  cpanel_url    text,
  ssl_expiry    date,
  domain        text,
  project_ids   uuid[] default '{}',
  client_ids    uuid[] default '{}',
  created_at    timestamptz default now()
);
alter table servers enable row level security;

-- ============================================================
-- RLS Policies
-- ============================================================

-- Helper: check if current user is linked to a contact via profiles
create or replace function my_contact_id()
returns uuid language sql security definer as $$
  select contact_id from profiles where id = auth.uid();
$$;

-- ── companies ────────────────────────────────────────────────
drop policy if exists "admin_all_companies" on companies;
create policy "admin_all_companies" on companies for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_company" on companies;
create policy "client_read_own_company" on companies for select using (
  id in (select company_id from contacts where id = my_contact_id())
);

-- ── contacts ─────────────────────────────────────────────────
drop policy if exists "admin_all_contacts" on contacts;
create policy "admin_all_contacts" on contacts for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_self_contact" on contacts;
create policy "client_read_self_contact" on contacts for select using (id = my_contact_id());

-- ── deals ────────────────────────────────────────────────────
drop policy if exists "admin_all_deals" on deals;
create policy "admin_all_deals" on deals for all using (is_admin()) with check (is_admin());

-- ── projects ─────────────────────────────────────────────────
drop policy if exists "admin_all_projects" on projects;
create policy "admin_all_projects" on projects for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_project" on projects;
create policy "client_read_own_project" on projects for select using (
  contact_id = my_contact_id()
);

-- ── conversations ─────────────────────────────────────────────
drop policy if exists "admin_all_conversations" on conversations;
create policy "admin_all_conversations" on conversations for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_conversation" on conversations;
create policy "client_read_own_conversation" on conversations for select using (
  contact_id = my_contact_id()
);

-- ── messages ─────────────────────────────────────────────────
drop policy if exists "admin_all_messages" on messages;
create policy "admin_all_messages" on messages for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_messages" on messages;
create policy "client_read_own_messages" on messages for select using (
  conversation_id in (
    select id from conversations where contact_id = my_contact_id()
  )
);

drop policy if exists "client_insert_own_messages" on messages;
create policy "client_insert_own_messages" on messages for insert with check (
  conversation_id in (
    select id from conversations where contact_id = my_contact_id()
  ) and from_role = 'client'
);

-- ── contracts ────────────────────────────────────────────────
drop policy if exists "admin_all_contracts" on contracts;
create policy "admin_all_contracts" on contracts for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_contracts" on contracts;
create policy "client_read_own_contracts" on contracts for select using (
  contact_id = my_contact_id()
);

-- ── proposals ────────────────────────────────────────────────
drop policy if exists "admin_all_proposals" on proposals;
create policy "admin_all_proposals" on proposals for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_proposals" on proposals;
create policy "client_read_own_proposals" on proposals for select using (
  contact_id = my_contact_id()
);

-- ── forms ────────────────────────────────────────────────────
drop policy if exists "admin_all_forms" on forms;
create policy "admin_all_forms" on forms for all using (is_admin()) with check (is_admin());

drop policy if exists "anyone_read_active_forms" on forms;
create policy "anyone_read_active_forms" on forms for select using (status = 'active');

drop policy if exists "admin_all_form_responses" on form_responses;
create policy "admin_all_form_responses" on form_responses for all using (is_admin()) with check (is_admin());

drop policy if exists "anyone_insert_form_responses" on form_responses;
create policy "anyone_insert_form_responses" on form_responses for insert with check (true);

-- ── documents ────────────────────────────────────────────────
drop policy if exists "admin_all_documents" on documents;
create policy "admin_all_documents" on documents for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_documents" on documents;
create policy "client_read_own_documents" on documents for select using (
  project_id in (select id from projects where contact_id = my_contact_id())
);

-- ── notifications ─────────────────────────────────────────────
drop policy if exists "own_notifications" on notifications;
create policy "own_notifications" on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── portals ──────────────────────────────────────────────────
drop policy if exists "admin_all_portals" on portals;
create policy "admin_all_portals" on portals for all using (is_admin()) with check (is_admin());

drop policy if exists "client_read_own_portal" on portals;
create policy "client_read_own_portal" on portals for select using (
  contact_id = my_contact_id()
);

-- ── servers ──────────────────────────────────────────────────
drop policy if exists "admin_all_servers" on servers;
create policy "admin_all_servers" on servers for all using (is_admin()) with check (is_admin());

-- ── profiles ─────────────────────────────────────────────────
drop policy if exists "own_profile" on profiles;
create policy "own_profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "admin_read_all_profiles" on profiles;
create policy "admin_read_all_profiles" on profiles for select using (is_admin());

-- ============================================================
-- Realtime
-- Enable realtime on tables that need live updates
-- ============================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table conversations;
