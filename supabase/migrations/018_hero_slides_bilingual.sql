-- 히어로 슬라이드 국·영문 분리 (기존 main_text/sub_text = 국문 유지)
alter table public.hero_slides
  add column if not exists main_text_en text,
  add column if not exists sub_text_en text;

comment on column public.hero_slides.main_text is '메인 카피(국문). 첫 줄바꿈 앞뒤로 큰 제목 두 줄';
comment on column public.hero_slides.main_text_en is '메인 카피(영문)';
comment on column public.hero_slides.sub_text is '서브 카피(국문)';
comment on column public.hero_slides.sub_text_en is '서브 카피(영문)';
