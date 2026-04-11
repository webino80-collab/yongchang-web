-- ============================================================
-- 006: 레거시 brochures.title (NOT NULL) + 앱은 title_ko 만 INSERT 할 때
-- 오류: null value in column "title" of relation "brochures" violates not-null constraint
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 기존 행: title 비어 있고 title_ko 있으면 채움
update public.brochures
set title = title_ko
where title is null
  and title_ko is not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brochures'
      and column_name = 'title'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'brochures'
      and column_name = 'title_ko'
  ) then
    create or replace function public.brochures_sync_title_from_ko()
    returns trigger
    language plpgsql
    as $f$
    begin
      if new.title is null and new.title_ko is not null then
        new.title := new.title_ko;
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
