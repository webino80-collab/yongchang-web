-- ============================================================
-- 011_products_seed.sql
-- public.products 가 비어 있을 때만 샘플 데이터 삽입
-- (스키마·버킷·RLS는 003_site_content_tables.sql 에 포함)
-- ============================================================

insert into public.products (title_ko, title_en, desc_ko, desc_en, category, sort_order)
select v.title_ko, v.title_en, v.desc_ko, v.desc_en, v.category, v.sort_order
from (
  values
    (
      '메조 니들'::text,
      'MESO NEEDLES'::text,
      '메조테라피용으로 특별히 설계된 초세밀 니들로 피부 층에 활성 성분을 정밀하게 전달합니다.'::text,
      'Ultra-fine needles specifically engineered for the precise intradermal delivery of active ingredients during mesotherapy.'::text,
      'needle'::text,
      1::int
    ),
    (
      '멀티니들',
      'MULTI NEEDLE',
      '초미세 가공 기술로 다중 핀 구성을 지원합니다.' || E'\n' || '• 니들 길이 1.0mm ~ 4.0mm' || E'\n' || '• 게이지 30G ~ 35G' || E'\n' || '• PIN 2 / 3 / 4 구성',
      'Multi-pin configuration with micro-precision engineering.' || E'\n' || '• Needle length 1.0mm – 4.0mm' || E'\n' || '• Gauge 30G – 35G' || E'\n' || '• 2 / 3 / 4 pin options',
      'needle',
      2
    ),
    (
      '필러 캐뉼라',
      'FILLER CANNULA',
      '단일 진입점으로 넓은 영역에 정밀한 필러 전달이 가능하여 멍과 붓기를 최소화합니다.',
      'A single entry point allows for precise filler delivery across a wide area, significantly minimizing bruising and swelling.',
      'cannula',
      3
    ),
    (
      'OSG 캐뉼라',
      'OSG CANNULA',
      '조직 손상을 최소화하여 환자 통증을 줄이고 정확하고 안전하게 약물을 전달합니다.',
      'Minimizes tissue trauma to alleviate patient pain, empowering clinicians to deliver medication accurately and safely.',
      'cannula',
      4
    ),
    (
      '캐뉼라',
      'CANNULA',
      '기존 주사침에 비해 통증, 멍, 붓기를 줄이고 단일 절개로 넓은 영역에서 균일한 시술이 가능합니다.',
      'Compared to conventional needles, it reduces pain, bruising, and swelling, enabling safe and uniform procedures.',
      'cannula',
      5
    ),
    (
      '척추 니들',
      'SPINAL NEEDLE',
      '척추 마취, 뇌척수액 채취 또는 진단 주사를 위해 지주막하 공간에 접근하도록 설계된 고정밀 니들입니다.',
      'Thin, elongated, and high-precision needles specifically designed to access the subarachnoid space for spinal anesthesia.',
      'anesthesia',
      6
    ),
    (
      '경막외 니들',
      'EPIDURAL NEEDLE',
      '분만 또는 수술 후 통증 관리에 사용되는 경막외 마취용 두꺼운 벽의 강성 니들입니다.',
      'A thick-walled, rigid needle designed for insertion into the epidural space for anesthesia or analgesia.',
      'anesthesia',
      7
    )
) as v(title_ko, title_en, desc_ko, desc_en, category, sort_order)
where not exists (select 1 from public.products limit 1);
