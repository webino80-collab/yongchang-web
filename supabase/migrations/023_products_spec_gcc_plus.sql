-- GCC+ 규격: 상단 안내 문구 + 이중 표(JSON)

alter table public.products
  add column if not exists spec_gcc_plus_intro_ko text,
  add column if not exists spec_gcc_plus_intro_en text,
  add column if not exists spec_gcc_plus_tables jsonb;

comment on column public.products.spec_gcc_plus_intro_ko is 'GCC+ 서브구분 상단 설명(국문)';
comment on column public.products.spec_gcc_plus_intro_en is 'GCC+ 서브구분 상단 설명(영문)';
comment on column public.products.spec_gcc_plus_tables is 'GCC+ 표 배열: [{title_ko,title_en,rows:[{gauge,color_hex,length}]}]';
