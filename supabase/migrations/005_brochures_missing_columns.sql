-- ============================================================
-- 005: brochures 테이블 — 앱(brochureService / database.types)과 컬럼 맞추기
-- 오류 예: cover_image_url / title_ko 등 "schema cache" 에 없음
-- Supabase SQL Editor에서 실행 후 10~30초 기다리거나 API 재시도
-- ============================================================

alter table public.brochures add column if not exists title_ko text;
alter table public.brochures add column if not exists title_en text;
alter table public.brochures add column if not exists desc_ko text;
alter table public.brochures add column if not exists desc_en text;
alter table public.brochures add column if not exists cover_image_url text;
alter table public.brochures add column if not exists file_url text;
alter table public.brochures add column if not exists file_size bigint;
alter table public.brochures add column if not exists category text not null default '제품 카탈로그';
alter table public.brochures add column if not exists sort_order int not null default 0;
alter table public.brochures add column if not exists is_active boolean not null default true;
alter table public.brochures add column if not exists created_at timestamptz not null default now();

-- 레거시 제목 컬럼 → title_ko
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'title'
  ) then
    update public.brochures set title_ko = title where title_ko is null and title is not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'name'
  ) then
    update public.brochures set title_ko = name where title_ko is null and name is not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'subject'
  ) then
    update public.brochures set title_ko = subject where title_ko is null and subject is not null;
  end if;
end $$;

-- 레거시 컬럼명이 다르면 데이터만 옮김 (있을 때만)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'cover_url'
  ) then
    update public.brochures
    set cover_image_url = cover_url
    where cover_image_url is null and cover_url is not null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'pdf_url'
  ) then
    update public.brochures
    set file_url = pdf_url
    where file_url is null and pdf_url is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
