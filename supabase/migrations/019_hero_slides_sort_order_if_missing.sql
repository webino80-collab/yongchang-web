-- 예전 스키마로 hero_slides만 만든 경우 sort_order 누락 보완
alter table public.hero_slides
  add column if not exists sort_order int not null default 0;
