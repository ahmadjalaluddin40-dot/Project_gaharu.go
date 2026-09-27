-- =============================================================
-- GAHARU Website - Supabase database setup
-- Jalankan file ini di Supabase: Dashboard -> SQL Editor -> New query
-- (atau via CLI: supabase db push)
-- =============================================================

create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  form_type text not null default 'contact',
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 180),
  organization text check (organization is null or char_length(organization) <= 180),
  message text not null check (char_length(message) between 10 and 4000),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Kebijakan RLS: pengunjung publik (anon) hanya boleh MENYIMPAN pesan.
-- Tidak ada kebijakan SELECT/UPDATE/DELETE, jadi isi formulir tidak bisa
-- dibaca, diubah, atau dihapus dari sisi klien. Admin tetap bisa membaca
-- lewat dashboard Supabase (service_role melewati RLS).
create policy "public can submit messages"
  on public.contact_messages
  for insert
  to anon
  with check (true);
