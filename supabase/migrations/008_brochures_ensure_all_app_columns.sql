-- ============================================================
-- 008: brochures — 앱이 INSERT/SELECT 하는 컬럼 전부 한 번에 보강
-- 오류 예: file_size / desc_ko / cover_image_url … schema cache
-- yc2025 등 레거시 테이블에 005~007을 일부만 돌렸을 때 이 파일만 실행해도 됨
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

-- 레거시 → file_size
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'filesize'
  ) then
    update public.brochures set file_size = filesize::bigint
    where file_size is null and filesize is not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'size'
  ) then
    update public.brochures set file_size = size::bigint
    where file_size is null and size is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
