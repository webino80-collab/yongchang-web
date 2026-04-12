-- 메인 롤링: 영문 사이트용 이미지 (비우면 국문 image_url 사용)
alter table public.home_rolling_slides
  add column if not exists image_url_en text null;

comment on column public.home_rolling_slides.image_url_en is 'English rolling banner; null/empty → use image_url on EN site';
