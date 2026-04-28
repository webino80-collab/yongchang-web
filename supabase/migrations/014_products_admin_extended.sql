-- ============================================================
-- 014_products_admin_extended.sql
-- 운영 제품 등록폼 대응: 요약·특징(5)·상세 HTML·규격 행·서브타입
-- 미적용 시 관리자 폼 저장 시 PostgREST 400(PGRST204 등)이 날 수 있음.
-- ============================================================

alter table public.products
  add column if not exists subtitle_ko text,
  add column if not exists subtitle_en text,
  add column if not exists summary_ko text,
  add column if not exists summary_en text,
  add column if not exists features_ko jsonb not null default '["","","","",""]'::jsonb,
  add column if not exists features_en jsonb not null default '["","","","",""]'::jsonb,
  add column if not exists detail_html_ko text,
  add column if not exists detail_html_en text,
  add column if not exists spec_subtype text,
  add column if not exists spec_rows jsonb not null default '[]'::jsonb;

comment on column public.products.summary_ko is '제품 기본설명(짧은 요약)';
comment on column public.products.detail_html_ko is '제품 상세설명 HTML';
comment on column public.products.spec_rows is '규격 행 배열: gauge, length, color_hex, wall_type, measurement';
