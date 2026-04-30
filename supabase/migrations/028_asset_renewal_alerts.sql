-- 호스팅/SSL 만료 알림 관리 (최고 관리자 운영용)

create table if not exists public.asset_renewals (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null check (asset_type in ('hosting', 'ssl')),
  asset_name text not null,
  provider text null,
  target text null,
  expires_at date not null,
  notify_days_before int not null default 14 check (notify_days_before between 1 and 365),
  notify_email text not null default 'jmpapa@kakao.com',
  last_notified_at timestamptz null,
  is_active boolean not null default true,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asset_renewals_expires_idx
  on public.asset_renewals (expires_at);

create index if not exists asset_renewals_active_idx
  on public.asset_renewals (is_active, expires_at);

alter table public.asset_renewals enable row level security;

drop policy if exists "admin all asset_renewals" on public.asset_renewals;
create policy "admin all asset_renewals" on public.asset_renewals
  for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

grant select on public.asset_renewals to anon, authenticated;
grant all on public.asset_renewals to authenticated;

