-- ============================================================
-- 012_products_gallery_urls.sql
-- 제품 상세 갤러리용 추가 이미지 URL 배열 (JSON)
-- ============================================================

alter table public.products
  add column if not exists gallery_urls jsonb not null default '[]'::jsonb;

comment on column public.products.gallery_urls is '상세 페이지 갤러리용 이미지 URL 배열 (대표 image_url 제외 추가 이미지)';
