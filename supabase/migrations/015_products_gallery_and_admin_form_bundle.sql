-- ============================================================
-- 015_products_gallery_and_admin_form_bundle.sql
-- PGRST204: gallery_urls / 확장 컬럼 없음 → 이 파일 한 번만 실행해도 됨
-- (012 + 014 내용을 idempotent 로 묶음. 이미 적용된 컬럼은 건너뜀)
-- Supabase Dashboard → SQL Editor → 전체 붙여넣기 → Run
-- ============================================================

-- ---- 012: 갤러리 URL 배열 ----
alter table public.products
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb;

comment on column public.products.gallery_urls is '상세 페이지 갤러리용 이미지 URL 배열 (대표 image_url 제외 추가 이미지)';

-- ---- 014: 관리자 제품 폼 확장 ----
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
