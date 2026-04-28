export type Lang = "ko" | "en";

export const t = {
  /* ─── GNB ─── */
  nav: {
    company:   { ko: "기업소개",   en: "Company" },
    product:   { ko: "제품소개",   en: "Products" },
    needle:    { ko: "NEEDLE",    en: "NEEDLE" },
    cannula:   { ko: "캐뉼라",    en: "Cannula" },
    anesthesia:{ ko: "마취용 침", en: "Anesthesia" },
    syringe:   { ko: "주사기",    en: "Syringe" },
    cert:      { ko: "특허 & 인증", en: "Certificates" },
    brochure:  { ko: "브로셔",    en: "Brochures" },
    contact:   { ko: "문의하기",  en: "Contact Us" },
  },

  /* ─── Home ─── */
  home: {
    heroCopy1: { ko: "언제나 고객님과",              en: "Always by your side," },
    heroCopy2: { ko: "함께하는",                    en: "together with" },
    heroSub:   {
      ko: "니들·캐뉼라·마취용 침·주사기 전문 제조기업.\n30년 이상의 기술력과 엄격한 품질 관리로\n국내외 의료 현장을 지원합니다.",
      en: "Specialist manufacturer of needles, cannulas,\nanesthesia needles & syringes.\nOver 30 years of expertise supporting global healthcare.",
    },
    heroHeadline1: {
      ko: "말이 아닌 과정으로\n증명합니다.",
      en: "Proven Through Process,\nNot Words.",
    },
    heroHeadline2: {
      ko: "전 세계 의료 전문가가 신뢰하는\n용창의 의료용 니들.",
      en: "Yongchang Needles: Trusted by Medical\nProfessionals Around the World.",
    },
    heroBtn1: { ko: "제품 보러가기",   en: "View Products" },
    heroBtn2: { ko: "문의하기",        en: "Contact Us" },

    /**
     * 메인 히어로 4슬롯 — line1·line2: 큰 헤드라인(타임라인 라벨과 동일)
     * subLine1·subLine2: 헤드라인 아래 보조 문구(작은 타이포)
     */
    heroTimeline: [
      {
        line1: { ko: "타협 없는 정밀함,", en: "Uncompromising precision," },
        line2: { ko: "의료기기의 새로운 기준, 용창!", en: "the new standard in medical devices — Yongchang!" },
        subLine1: {
          ko: "니들·캐뉼라·마취용 침·주사기 전문 제조로",
          en: "Specializing in needles, cannulas, anesthesia needles and syringes,",
        },
        subLine2: {
          ko: "30년 이상의 기술력으로 국내외 의료 현장을 지원합니다.",
          en: "we support healthcare worldwide with over 30 years of expertise.",
        },
      },
      {
        line1: { ko: "기술이 닿는 곳에", en: "Where technology reaches," },
        line2: { ko: "고통은 머물지 않도록", en: "pain does not linger." },
        subLine1: {
          ko: "0.1mm의 오차도 허용하지 않는 디테일로",
          en: "With tolerances tighter than 0.1mm,",
        },
        subLine2: {
          ko: "환자에게 가장 부드러운 침습 경험을 선사합니다.",
          en: "we deliver the gentlest invasive experience for patients.",
        },
      },
      {
        line1: { ko: "검증된 무결점 프로세스,", en: "A proven, flawless process," },
        line2: { ko: "글로벌 스탠다드의 기준을 세우다.", en: "setting the benchmark for global standards." },
        subLine1: {
          ko: "엄격한 품질 관리 시스템(QMS)과 광범위한 글로벌 인증으로",
          en: "Through a rigorous QMS and extensive global certifications,",
        },
        subLine2: {
          ko: "차별화된 품질을 자부합니다.",
          en: "we stand behind truly differentiated quality.",
        },
      },
      {
        line1: { ko: "미래 의료환경의 성공적인 파트너", en: "A successful partner for tomorrow's healthcare environment." },
        line2: { ko: "", en: "" },
        subLine1: {
          ko: "첨단 기술과 혁신적인 인프라를 바탕으로",
          en: "With advanced technology and innovative infrastructure,",
        },
        subLine2: {
          ko: "파트너의 다음 도약을 강력히 지원합니다.",
          en: "we empower your next leap forward.",
        },
      },
    ] as const,

    bizSectionLabel: { ko: "Business", en: "Business" },
    bizSectionTitle: { ko: "용창의 기술력이\n만들어내는 차이", en: "The Difference\nYongchang Makes" },

    bizSections: [
      {
        label:      { ko: "Technology", en: "Technology" },
        desc:       { ko: "0.1mm까지의 정밀함으로 환자에게 가장 부드러운 침습 경험을 제공합니다.", en: "With precision down to 0.1mm, we provide patients with the gentlest invasive experience." },
        imgIndex:   1,
      },
      {
        label:      { ko: "Quality", en: "Quality" },
        desc:       { ko: "용창은 엄격한 품질 관리 시스템(QMS)과 광범위한 글로벌 인증으로 차별화된 품질을 자부합니다.", en: "Yongchang takes pride in a strict Quality Management System (QMS) and extensive global certification archive." },
        imgIndex:   2,
      },
    ],

    /* ── 하위 호환: bizSlides (BizSection 제거 후에도 다른 곳에서 참조 시 안전하게 유지) ── */
    bizSlides: [
      {
        label: { ko: "Business",   en: "Business" },
        title: { ko: "말이 아닌 과정으로\n증명합니다.",   en: "Proven Through Process,\nNot Words." },
        desc:  { ko: "전 세계 의료 전문가들이 신뢰하는 용창의 의료용 니들.", en: "Yongchang Needles: Trusted by Medical Professionals Around the World." },
      },
      {
        label: { ko: "Technology", en: "Technology" },
        title: { ko: "기술이 닿는 곳,\n통증이 사라집니다", en: "Where Technology\nReaches, Pain Disappears" },
        desc:  { ko: "0.1mm까지의 정밀함으로 환자에게 가장 부드러운 침습 경험을 제공합니다.", en: "With precision down to 0.1mm, we provide patients with the gentlest invasive experience." },
      },
      {
        label: { ko: "Quality",    en: "Quality" },
        title: { ko: "완벽함. 신뢰.\n글로벌 스탠다드.",  en: "Flawless. Proven.\nGlobal Standard." },
        desc:  { ko: "용창은 엄격한 품질 관리 시스템(QMS)과 광범위한 글로벌 인증으로 차별화된 품질을 자부합니다.", en: "Yongchang takes pride in a strict QMS and an extensive archive of global certifications." },
      },
    ],

    partnerLabel:   { ko: "Partnership", en: "Partnership" },
    partnerTitle:   { ko: "의료의 미래를\n함께합니다.", en: "Partnering the\nFuture of Healthcare." },
    partnerDesc:    { ko: "첨단 기술과 혁신적인 인프라를 바탕으로\n파트너의 다음 도약을 강력히 지원합니다.", en: "Leveraging our advanced technology and innovative infrastructure,\nwe strongly support your next breakthrough." },
    partnerBtn1:    { ko: "문의하기",        en: "Contact Us" },
    partnerBtn2:    { ko: "브로셔 다운로드", en: "Download Brochure" },

    productsLabel: { ko: "PRODUCTS", en: "PRODUCTS" },
    productsTitle: { ko: "혁신적인 기술력으로\n글로벌 스탠다드의 기준을\n새롭게 써내려갑니다.", en: "Rewriting the Global Standard\nThrough\nInnovative Technology." },

    products: [
      { title: { ko: "메조니들",      en: "Meso Needles"    }, desc: { ko: "메조니들은 메조테라피 시술 시 약물을 진피층에 정교하게 전달하기 위해 설계된 초미세 주사 바늘입니다.", en: "Meso-needles are ultra-fine needles engineered for precise intradermal delivery during mesotherapy." } },
      { title: { ko: "필러캐뉼라",    en: "Filler Cannula"  }, desc: { ko: "바늘 구멍 하나로 넓은 부위에 필러를 정교하게 채울 수 있어 멍과 부기를 최소화하고 시술 안전성을 높여줍니다.", en: "A single entry point allows precise filler delivery across a wide area, minimizing bruising and swelling." } },
      { title: { ko: "OSG 캐뉼라",   en: "OSG Cannula"     }, desc: { ko: "시술 시 조직 손상을 줄여 환자의 통증을 완화하고, 의사가 타겟 층에 정확하고 안전하게 약물을 주입할 수 있도록 돕습니다.", en: "Minimizes tissue trauma to alleviate patient pain and enables accurate, safe medication delivery." } },
      { title: { ko: "캐뉼라",        en: "Cannula"         }, desc: { ko: "일반 주사바늘에 비해 통증, 멍, 부종이 적고 한 번의 절개로 넓은 부위에 안전하고 균일한 시술이 가능합니다.", en: "Less pain, bruising and swelling than conventional needles; safe, uniform treatment via a single incision." } },
      { title: { ko: "척수마취용침",  en: "Spinal Needle"   }, desc: { ko: "척수마취, 뇌척수액 채취 또는 진단 목적의 주사 시 지주막하 공간에 접근하기 위해 설계된 정밀한 바늘.", en: "High-precision needles designed to access the subarachnoid space for spinal anesthesia or CSF collection." } },
      { title: { ko: "경막외투여용침", en: "Epidural Needle" }, desc: { ko: "마취 또는 진통을 위해 경막외 공간에 삽입하도록 설계된 견고한 바늘. 분만 시 또는 수술 후 통증 관리에 사용.", en: "A thick-walled needle for epidural anesthesia or analgesia, used in labor or post-operative pain management." } },
    ],

    contactLabel: { ko: "Contact Us",              en: "Contact Us" },
    contactTitle: { ko: "제품 및 거래 문의",         en: "Product & Trade Inquiry" },
    contactDesc:  { ko: "빠른 답변과 친절한 상담을 약속드립니다.", en: "We promise swift replies and friendly consultation." },
    contactBtn1:  { ko: "온라인 문의",               en: "Online Inquiry" },
  },

  /* ─── About ─── */
  about: {
    heroLabel: { ko: "Company",    en: "Company" },
    heroTitle: { ko: "35년을 이어온\n신뢰와 혁신의 역사", en: "35 Years of\nTrust & Innovation" },
    heroDesc:  { ko: "주식회사 용창은 1989년 창업 이후 니들·캐뉼라·마취용 침·주사기를 전문으로 제조하는 의료기기 기업입니다.", en: "Since 1989, Yongchang has been a specialist medical device manufacturer of needles, cannulas, anesthesia needles and syringes." },
    overviewText: { ko: "Redefining the Industry Standard", en: "Redefining the Industry Standard" },
    overviewTitle: { ko: "The World's First 35G Production Certification.", en: "The World's First 35G Production Certification." },
    valuesTitle: { ko: "우리의\n가치", en: "Our\nValues" },
    timelineTitle: { ko: "우리가\n걸어온\n길", en: "The Path\nWe Have\nWalked" },
    ctaTitle: { ko: "함께 성장할 파트너를\n기다립니다", en: "We Welcome\nPartners to Grow With" },
    ctaDesc:  { ko: "제품 문의, OEM·ODM 협업, 수출 파트너십 모두 환영합니다.", en: "We welcome product inquiries, OEM/ODM collaboration, and export partnerships." },
    ctaBtn1:  { ko: "문의하기",        en: "Contact Us" },
    ctaBtn2:  { ko: "브로셔 다운로드", en: "Download Brochure" },
  },

  /* ─── Contact ─── */
  contact: {
    heroLabel: { ko: "Contact Us",       en: "Contact Us" },
    heroTitle: { ko: "제품 및 거래 문의", en: "Product & Trade Inquiry" },
    heroDesc:  { ko: "빠른 답변과 친절한 상담을 약속드립니다.", en: "We promise swift replies and friendly consultation." },
    formLabel: { ko: "Online Inquiry",   en: "Online Inquiry" },
    formTitle: { ko: "온라인 문의",       en: "Online Inquiry" },
    formDesc:  { ko: "아래 양식을 작성하시면 담당자가 신속하게 연락드리겠습니다.", en: "Fill in the form below and our team will get back to you promptly." },
  },

  /* ─── Footer ─── */
  footer: {
    hours: { ko: "운영시간", en: "Business Hours" },
    hoursDetail: { ko: "월~금  08:30 – 18:00\n점심  12:00 – 13:00\n토·일·공휴일 휴무", en: "Mon–Fri  08:30 – 18:00\nLunch  12:00 – 13:00\nClosed on weekends & holidays" },
    copy: { ko: "주식회사 용창. All rights reserved.", en: "Yongchang Co., Ltd. All rights reserved." },
  },
} as const;

/** 간편 헬퍼 — t.nav.company[lang] 대신 tr(t.nav.company, lang) */
export function tr(obj: { ko: string; en: string }, lang: Lang): string {
  return obj[lang];
}
