-- ============================================================
-- 007: brochures.desc_ko / desc_en (설명 컬럼)
-- 오류: Could not find the 'desc_ko' column ... in the schema cache
-- 005를 일부만 실행했거나 캐시가 안 갱신된 경우 이 파일만 다시 실행해도 됨
-- ============================================================

alter table public.brochures add column if not exists desc_ko text;
alter table public.brochures add column if not exists desc_en text;

-- 레거시 설명 컬럼 → desc_ko / desc_en
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'description'
  ) then
    update public.brochures
    set desc_ko = description
    where desc_ko is null and description is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'content'
  ) then
    update public.brochures
    set desc_ko = content
    where desc_ko is null and content is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'body'
  ) then
    update public.brochures
    set desc_ko = body
    where desc_ko is null and body is not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'description_en'
  ) then
    update public.brochures
    set desc_en = description_en
    where desc_en is null and description_en is not null;
  end if;
end $$;

notify pgrst, 'reload schema';
