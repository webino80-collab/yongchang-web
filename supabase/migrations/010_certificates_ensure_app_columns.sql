-- ============================================================
-- 010: certificates 테이블 + cert-images 버킷 (yc2025 레거시·누락 보강)
-- 이미 003을 실행했다면 대부분 건너뜀. 목록 404/스키마 오류일 때만 실행해도 됨.
-- JWT app_metadata 관리자는 004_admin_rls_jwt_and_brochure_fix.sql 도 실행 권장.
-- ============================================================

create table if not exists public.certificates (
  id          uuid primary key default gen_random_uuid(),
  title_ko    text not null,
  title_en    text,
  cert_type   text not null default 'certificate',
  image_url   text,
  issued_by   text,
  issued_year text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.certificates add column if not exists title_ko text;
alter table public.certificates add column if not exists title_en text;
alter table public.certificates add column if not exists cert_type text not null default 'certificate';
alter table public.certificates add column if not exists image_url text;
alter table public.certificates add column if not exists issued_by text;
alter table public.certificates add column if not exists issued_year text;
alter table public.certificates add column if not exists sort_order int not null default 0;
alter table public.certificates add column if not exists is_active boolean not null default true;
alter table public.certificates add column if not exists created_at timestamptz not null default now();

alter table public.certificates enable row level security;

drop policy if exists "public read active" on public.certificates;
drop policy if exists "admin all" on public.certificates;

create policy "public read active" on public.certificates
  for select to public using (is_active = true);

create policy "admin all" on public.certificates for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

grant select on public.certificates to anon, authenticated;
grant all on public.certificates to authenticated;

insert into storage.buckets (id, name, public)
values ('cert-images', 'cert-images', true)
on conflict (id) do nothing;

drop policy if exists "public read cert-images" on storage.objects;
create policy "public read cert-images" on storage.objects
  for select using (bucket_id = 'cert-images');

drop policy if exists "admin cert-images insert" on storage.objects;
create policy "admin cert-images insert" on storage.objects
  for insert with check (
    bucket_id = 'cert-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admin cert-images delete" on storage.objects;
create policy "admin cert-images delete" on storage.objects
  for delete using (
    bucket_id = 'cert-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

notify pgrst, 'reload schema';
