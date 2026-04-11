-- ============================================================
-- 009: 레거시 brochures.title NOT NULL + 앱은 주로 title_ko 사용
-- 오류: null value in column "title" ... violates not-null constraint
-- ============================================================

-- 1) NOT NULL 제거 — title 없이 title_ko만 있어도 INSERT 허용 (앱 기준은 title_ko)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brochures'
      and column_name = 'title'
  ) then
    alter table public.brochures alter column title drop not null;
  end if;
end $$;

-- 2) 트리거 갱신: 빈 문자열·NULL 모두 title_ko에서 title 채움 (있을 때만)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'title'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'brochures' and column_name = 'title_ko'
  ) then
    create or replace function public.brochures_sync_title_from_ko()
    returns trigger
    language plpgsql
    as $f$
    declare
      ko text;
    begin
      ko := nullif(trim(coalesce(new.title_ko, '')), '');
      if ko is null then
        ko := nullif(trim(coalesce(new.title, '')), '');
      end if;

      if ko is not null
         and (new.title is null or trim(coalesce(new.title, '')) = '') then
        new.title := ko;
      end if;

      return new;
    end;
    $f$;

    drop trigger if exists brochures_sync_title_from_ko on public.brochures;
    create trigger brochures_sync_title_from_ko
      before insert or update on public.brochures
      for each row
      execute procedure public.brochures_sync_title_from_ko();
  end if;
end $$;

notify pgrst, 'reload schema';
