-- 제품 분류(slug)별 표시명(국·영) 및 순서 — products.category 문자열과 slug가 일치합니다.

create table if not exists public.product_categories (
  slug text primary key,
  label_ko text not null,
  label_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create index if not exists product_categories_sort_idx
  on public.product_categories (sort_order);

alter table public.product_categories enable row level security;

drop policy if exists "public read active product_categories" on public.product_categories;
create policy "public read active product_categories" on public.product_categories
  for select to public
  using (is_active = true);

drop policy if exists "admin all product_categories" on public.product_categories;
create policy "admin all product_categories" on public.product_categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

grant select on public.product_categories to anon, authenticated;
grant all on public.product_categories to authenticated;

insert into public.product_categories (slug, label_ko, label_en, sort_order, is_active) values
  ('needle',     '니들',       'Needle',          1, true),
  ('cannula',    '캐뉼라',     'Cannula',         2, true),
  ('anesthesia', '천자침',     'Puncture needle', 3, true),
  ('syringe',    '주사기',     'Syringe',         4, true),
  ('other',      '기타',       'Other',           5, true)
on conflict (slug) do nothing;
