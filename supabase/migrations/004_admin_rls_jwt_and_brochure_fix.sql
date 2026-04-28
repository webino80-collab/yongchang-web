-- ============================================================
-- 004: 관리자 RLS — profiles.is_admin 또는 JWT app_metadata.is_admin
-- (프로필 행 없이 JWT만 관리자인 경우 INSERT/UPDATE 403·실패 방지)
-- Supabase SQL Editor에서 실행
-- ============================================================

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin is true
    )
    or coalesce(
      (select (auth.jwt()->'app_metadata'->>'is_admin')::boolean),
      false
    );
$$;

grant execute on function public.is_app_admin() to authenticated;

-- 콘텐츠 테이블 관리자 정책 교체 (USING + WITH CHECK 명시 — INSERT 안정화)
do $$
declare
  t text;
begin
  foreach t in array ARRAY[
    'hero_slides',
    'home_products',
    'products',
    'certificates',
    'brochures',
    'page_banners'
  ]
  loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format(
      'create policy "admin all" on public.%I for all
       using (public.is_app_admin())
       with check (public.is_app_admin())',
      t
    );
  end loop;
end $$;

-- brochures: category 컬럼 없으면 추가 (구버전 DDL 대비)
alter table public.brochures
  add column if not exists category text not null default '제품 카탈로그';
