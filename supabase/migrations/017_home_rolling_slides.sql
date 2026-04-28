-- 메인 히어로 바로 아래 롤링 이미지(최대 3장 권장, sort_order·활성 순으로 표시)
-- RLS: 공개는 is_active=true, CRUD는 is_app_admin()

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
