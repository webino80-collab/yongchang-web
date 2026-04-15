import type { AboutTimelineYear } from "@/types";

/** DB 미적용·조회 실패 시 About 페이지 폴백용 기본 연혁 */
export const DEFAULT_ABOUT_TIMELINE_ITEMS: AboutTimelineYear[] = [
  {
    year: "2025",
    img_path: null,
    events: [
      {
        date: "2025.07",
        ko: "국내최초 AVF NEEDLE SET 제조 인증 취득",
        en: "First Domestic Certification for Manufacturing AVF Needle Sets",
      },
    ],
  },
  {
    year: "2024",
    img_path: "brand/2024_products.png",
    events: [
      {
        date: "2024.02",
        ko: "세계 최초 35G 생산 및 허가 취득",
        en: "World's First Production and Regulatory Approval of 35G Needles",
      },
      {
        date: "2024.08",
        ko: "CE MDR(필러캐뉼라, 메조니들)",
        en: "CE MDR Application Submitted (Filler Cannula, Meso Needles)",
      },
      { date: "2024.12", ko: "2공장장 증축에 따른 공장 이전", en: "Factory Relocation & Expansion" },
    ],
  },
  {
    year: "2023",
    img_path: null,
    events: [{ date: "2023.03", ko: "2공장 설립", en: "Establishment of the 2nd Manufacturing Plant" }],
  },
  {
    year: "2022",
    img_path: null,
    events: [
      { date: "2022.02", ko: "(주)용창 전제품 미국 FDA 신청", en: "Apply US FDA for all Yongchang products" },
      { date: "2022.09", ko: "(주)용창 전제품 브라질 ANVISA 신청", en: "Apply Brazil ANVISA for all Yongchang products" },
    ],
  },
  {
    year: "2021",
    img_path: null,
    events: [
      { date: "2021.01", ko: "코로나19 백신용 백신 주사기 제조", en: "Manufacturing Syringes for Covid-19 Vaccine" },
      {
        date: "2021.05",
        ko: "인슐린 주사기, 천자침 CE인증 획득",
        en: "Achievement CE Certificate of Insulin syringe and Puncture needles",
      },
      {
        date: "2021.06",
        ko: "대한민국 질병청에 코로나19 백신주사기 납품",
        en: "Supply the Syringes for Covid-19 Vaccine to Korean Government",
      },
    ],
  },
  {
    year: "2020",
    img_path: null,
    events: [
      {
        date: "2020.01",
        ko: "천자침 스파이널, 에피듀랄 니들 생산 및 판매시작",
        en: "Start production of Spinal and Epidural needle",
      },
      {
        date: "2020.06",
        ko: "멸균주사침, 메조니들, 필러캐뉼라 CE인증 획득",
        en: "Achievement CE Certificate of Sterile needles and Blunt type needles",
      },
      { date: "2020.09", ko: "인슐린 주사기 생산 및 판매 시작", en: "Start production of Insulin Syringes" },
    ],
  },
  {
    year: "2019",
    img_path: "brand/2019_products.png",
    events: [
      { date: "2019.01", ko: "김포시 사업장 이전", en: "Move to new building in Gimpo-si" },
      { date: "2019.02", ko: "4등급 KGMP인증 획득", en: "Achievement KGMP 4th Grade" },
    ],
  },
  {
    year: "2017",
    img_path: null,
    events: [
      {
        date: "2017.10",
        ko: "메조니들, 필러캐뉼라 생산 및 판매 시작",
        en: "Start production of Meso needle and Filler Cannula",
      },
    ],
  },
  {
    year: "2016",
    img_path: null,
    events: [{ date: "2016.08", ko: "법인전환", en: "Convert to a corporation" }],
  },
  {
    year: "2011",
    img_path: "brand/2011_products.png",
    events: [{ date: "2011.03", ko: "ISO인증 획득", en: "ISO 1st certification" }],
  },
  {
    year: "2004",
    img_path: null,
    events: [
      {
        date: "2004.11",
        ko: "KGMP 의료기기 제조 허가",
        en: "Medical Device manufacturing business permission, KGMP",
      },
    ],
  },
  {
    year: "1999",
    img_path: null,
    events: [{ date: "1999.05", ko: "용창설립", en: "Establish Yongchang company" }],
  },
];
