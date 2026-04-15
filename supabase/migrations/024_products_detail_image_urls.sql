-- 제품 상세: HTML 대신 국문/영문 전용 이미지 URL (관리자 상세이미지등록)
alter table public.products
  add column if not exists detail_image_url_ko text,
  add column if not exists detail_image_url_en text;

comment on column public.products.detail_image_url_ko is '상세 영역 이미지 URL (국문 언어 시)';
comment on column public.products.detail_image_url_en is '상세 영역 이미지 URL (영문 언어 시)';
