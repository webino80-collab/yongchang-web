-- ============================================================
-- 003_site_content_tables.sql
-- 홈 히어로·제품·인증·브로셔·페이지 배너용 테이블 (앱과 database.types.ts 기준)
-- Supabase → SQL Editor에서 이 파일 전체를 한 번에 실행하세요.
-- (이미 있는 테이블은 IF NOT EXISTS / IF NOT EXISTS 정책으로 건너뜀)
-- ============================================================

-- ---- hero_slides ----
create table if not exists public.hero_slides (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  main_text   text not null,
  sub_text    text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- home_products ----
create table if not exists public.home_products (
  id          uuid primary key default gen_random_uuid(),
  title_ko    text not null,
  title_en    text not null,
  desc_ko     text,
  desc_en     text,
  image_url   text,
  link_url    text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- products (제품소개 상세) ----
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  title_ko    text not null,
  title_en    text not null,
  desc_ko     text,
  desc_en     text,
  image_url   text,
  category    text not null default 'other',
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---- certificates ----
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

-- ---- brochures ----
create table if not exists public.brochures (
  id               uuid primary key default gen_random_uuid(),
  title_ko         text not null,
  title_en         text,
  desc_ko          text,
  desc_en          text,
  cover_image_url  text,
  file_url         text,
  file_size        bigint,
  category         text not null default '제품 카탈로그',
  sort_order       int  not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table public.brochures
  add column if not exists category text not null default '제품 카탈로그';

-- ---- page_banners ----
create table if not exists public.page_banners (
  id           uuid primary key default gen_random_uuid(),
  page_key     text not null unique,
  image_url    text,
  title_ko     text,
  title_en     text,
  subtitle_ko  text,
  subtitle_en  text,
  is_active    boolean not null default true,
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- RLS (관리자: profiles.is_admin, 공개: is_active = true 행만 SELECT)
-- ============================================================

alter table public.hero_slides enable row level security;
alter table public.home_products enable row level security;
alter table public.products enable row level security;
alter table public.certificates enable row level security;
alter table public.brochures enable row level security;
alter table public.page_banners enable row level security;

-- hero_slides
drop policy if exists "public read active" on public.hero_slides;
drop policy if exists "admin all" on public.hero_slides;
create policy "public read active" on public.hero_slides
  for select to public using (is_active = true);
create policy "admin all" on public.hero_slides for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- home_products
drop policy if exists "public read active" on public.home_products;
drop policy if exists "admin all" on public.home_products;
create policy "public read active" on public.home_products
  for select to public using (is_active = true);
create policy "admin all" on public.home_products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- products
drop policy if exists "public read active" on public.products;
drop policy if exists "admin all" on public.products;
create policy "public read active" on public.products
  for select to public using (is_active = true);
create policy "admin all" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- certificates
drop policy if exists "public read active" on public.certificates;
drop policy if exists "admin all" on public.certificates;
create policy "public read active" on public.certificates
  for select to public using (is_active = true);
create policy "admin all" on public.certificates for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- brochures
drop policy if exists "public read active" on public.brochures;
drop policy if exists "admin all" on public.brochures;
create policy "public read active" on public.brochures
  for select to public using (is_active = true);
create policy "admin all" on public.brochures for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- page_banners
drop policy if exists "public read active" on public.page_banners;
drop policy if exists "admin all" on public.page_banners;
create policy "public read active" on public.page_banners
  for select to public using (is_active = true);
create policy "admin all" on public.page_banners for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- PostgREST: anon이 공개 읽기 정책을 타려면 테이블에 SELECT 권한 필요
grant select on public.hero_slides to anon, authenticated;
grant select on public.home_products to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.certificates to anon, authenticated;
grant select on public.brochures to anon, authenticated;
grant select on public.page_banners to anon, authenticated;

grant all on public.hero_slides to authenticated;
grant all on public.home_products to authenticated;
grant all on public.products to authenticated;
grant all on public.certificates to authenticated;
grant all on public.brochures to authenticated;
grant all on public.page_banners to authenticated;

-- ============================================================
-- Storage 버킷 (이미 있으면 무시)
-- Dashboard에서 Public 버킷으로 만들어도 됨.
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('hero-images', 'hero-images', true),
  ('product-images', 'product-images', true),
  ('cert-images', 'cert-images', true),
  ('brochure-files', 'brochure-files', true),
  ('banner-images', 'banner-images', true)
on conflict (id) do nothing;

-- storage.objects 정책 (버킷별로 이름 구분)
drop policy if exists "public read hero-images" on storage.objects;
create policy "public read hero-images" on storage.objects
  for select using (bucket_id = 'hero-images');

drop policy if exists "admin hero-images insert" on storage.objects;
create policy "admin hero-images insert" on storage.objects
  for insert with check (
    bucket_id = 'hero-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admin hero-images delete" on storage.objects;
create policy "admin hero-images delete" on storage.objects
  for delete using (
    bucket_id = 'hero-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "public read product-images" on storage.objects;
create policy "public read product-images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "admin product-images insert" on storage.objects;
create policy "admin product-images insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admin product-images delete" on storage.objects;
create policy "admin product-images delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

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

drop policy if exists "public read brochure-files" on storage.objects;
create policy "public read brochure-files" on storage.objects
  for select using (bucket_id = 'brochure-files');

drop policy if exists "admin brochure-files insert" on storage.objects;
create policy "admin brochure-files insert" on storage.objects
  for insert with check (
    bucket_id = 'brochure-files'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admin brochure-files delete" on storage.objects;
create policy "admin brochure-files delete" on storage.objects
  for delete using (
    bucket_id = 'brochure-files'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "public read banner-images" on storage.objects;
create policy "public read banner-images" on storage.objects
  for select using (bucket_id = 'banner-images');

drop policy if exists "admin banner-images insert" on storage.objects;
create policy "admin banner-images insert" on storage.objects
  for insert with check (
    bucket_id = 'banner-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admin banner-images delete" on storage.objects;
create policy "admin banner-images delete" on storage.objects
  for delete using (
    bucket_id = 'banner-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
