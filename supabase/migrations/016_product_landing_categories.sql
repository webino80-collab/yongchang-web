-- 제품소개 랜딩(/board/product) 2×2 카드 — 카테고리별 이미지·문구
-- RLS: 공개는 is_active=true만 조회, CRUD는 is_app_admin()
--
-- is_app_admin()은 004에서 정의합니다. SQL Editor에서 016만 단독 실행할 때를 위해
-- 아래에서 동일 정의를 create or replace 합니다(004와 중복 실행해도 안전).

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

create table if not exists public.product_landing_categories (
  category text primary key
    check (category in ('needle', 'cannula', 'anesthesia', 'syringe')),
  title_ko text not null default '',
  title_en text not null default '',
  desc_ko text not null default '',
  desc_en text not null default '',
  image_url text,
  sort_order int not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists product_landing_categories_sort_idx
  on public.product_landing_categories (sort_order);

alter table public.product_landing_categories enable row level security;

drop policy if exists "public read active" on public.product_landing_categories;
create policy "public read active" on public.product_landing_categories
  for select
  to public
  using (is_active = true);

drop policy if exists "admin all" on public.product_landing_categories;
create policy "admin all" on public.product_landing_categories
  for all
  using (public.is_app_admin())
  with check (public.is_app_admin());

grant select on public.product_landing_categories to anon, authenticated;

insert into public.product_landing_categories (category, title_ko, title_en, desc_ko, desc_en, sort_order) values
  (
    'needle',
    'NEEDLE',
    'NEEDLE',
    '멸균주사침, 메조니들, 펜니들, 비이식형 혈관접속용 기구.',
    'Sterile syringe needles, meso needles, pen needles, and non-implantable vascular access devices.',
    1
  ),
  (
    'cannula',
    '캐뉼라',
    'CANNULA',
    '캐뉼라, 필러캐뉼라, OSG 캐뉼라.',
    'Cannula, filler cannula, OSG cannula.',
    2
  ),
  (
    'anesthesia',
    '마취용 침',
    'ANESTHESIA NEEDLE',
    '경막외투여용침, 척추마취용침.',
    'Epidural and spinal anesthesia needles.',
    3
  ),
  (
    'syringe',
    '주사기',
    'SYRINGE',
    '주사기, 인슐린 주사기.',
    'Syringes and insulin syringes.',
    4
  )
on conflict (category) do nothing;
