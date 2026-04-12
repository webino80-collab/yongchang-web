-- =============================================================================
-- 등록 오류 복구용 (Supabase → SQL Editor에서 전체 실행)
--   1) home_rolling_slides 테이블 없음
--   2) hero_slides: sort_order / main_text_en / sub_text_en 누락
-- 실행 후 몇 초 기다렸다가 관리자 페이지에서 다시 저장해 보세요.
-- =============================================================================

-- ---- hero_slides 누락 컬럼 (구버전 테이블 대비) ----
alter table public.hero_slides
  add column if not exists sort_order int not null default 0;

alter table public.hero_slides
  add column if not exists is_active boolean not null default true;

-- ---- is_app_admin (017과 동일, 이미 있으면 교체) ----
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

-- ---- home_rolling_slides ----
create table if not exists public.home_rolling_slides (
  id          uuid primary key default gen_random_uuid(),
  image_url   text not null,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists home_rolling_slides_sort_idx
  on public.home_rolling_slides (sort_order);

alter table public.home_rolling_slides enable row level security;

drop policy if exists "public read active" on public.home_rolling_slides;
create policy "public read active" on public.home_rolling_slides
  for select
  to public
  using (is_active = true);

drop policy if exists "admin all" on public.home_rolling_slides;
create policy "admin all" on public.home_rolling_slides
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

grant select on public.home_rolling_slides to anon, authenticated;

alter table public.home_rolling_slides
  add column if not exists image_url_en text null;

-- ---- hero_slides 영문 컬럼 ----
alter table public.hero_slides
  add column if not exists main_text_en text;

alter table public.hero_slides
  add column if not exists sub_text_en text;

comment on column public.hero_slides.main_text is '메인 카피(국문). 첫 줄바꿈 앞뒤로 큰 제목 두 줄';
comment on column public.hero_slides.main_text_en is '메인 카피(영문)';
comment on column public.hero_slides.sub_text is '서브 카피(국문)';
comment on column public.hero_slides.sub_text_en is '서브 카피(영문)';
