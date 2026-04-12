import { motion } from "framer-motion";
import { useLangStore } from "@/store/useLangStore";
import { t, tr } from "@/i18n/translations";
import { useBreakpoint } from "@/hooks/useBreakpoint";

/* ═══════════════════════════════════════════
   연혁 데이터 — ko/en 이중 언어
═══════════════════════════════════════════ */
function getTimeline(imgBase: string) {
  return [
    {
      year: "2025", img: null,
      events: [
        { date: "2025.07", ko: "국내최초 AVF NEEDLE SET 제조 인증 취득", en: "First Domestic Certification for Manufacturing AVF Needle Sets" },
      ],
    },
    {
      year: "2024", img: `${imgBase}/brand/2024_products.png`,
      events: [
        { date: "2024.02", ko: "세계 최초 35G 생산 및 허가 취득", en: "World's First Production and Regulatory Approval of 35G Needles" },
        { date: "2024.08", ko: "CE MDR(필러캐뉼라, 메조니들)", en: "CE MDR Application Submitted (Filler Cannula, Meso Needles)" },
        { date: "2024.12", ko: "2공장장 증축에 따른 공장 이전", en: "Factory Relocation & Expansion" },
      ],
    },
    {
      year: "2023", img: null,
      events: [
        { date: "2023.03", ko: "2공장 설립", en: "Establishment of the 2nd Manufacturing Plant" },
      ],
    },
    {
      year: "2022", img: null,
      events: [
        { date: "2022.02", ko: "(주)용창 전제품 미국 FDA 신청", en: "Apply US FDA for all Yongchang products" },
        { date: "2022.09", ko: "(주)용창 전제품 브라질 ANVISA 신청", en: "Apply Brazil ANVISA for all Yongchang products" },
      ],
    },
    {
      year: "2021", img: null,
      events: [
        { date: "2021.01", ko: "코로나19 백신용 백신 주사기 제조", en: "Manufacturing Syringes for Covid-19 Vaccine" },
        { date: "2021.05", ko: "인슐린 주사기, 천자침 CE인증 획득", en: "Achievement CE Certificate of Insulin syringe and Puncture needles" },
        { date: "2021.06", ko: "대한민국 질병청에 코로나19 백신주사기 납품", en: "Supply the Syringes for Covid-19 Vaccine to Korean Government" },
      ],
    },
    {
      year: "2020", img: null,
      events: [
        { date: "2020.01", ko: "천자침 스파이널, 에피듀랄 니들 생산 및 판매시작", en: "Start production of Spinal and Epidural needle" },
        { date: "2020.06", ko: "멸균주사침, 메조니들, 필러캐뉼라 CE인증 획득", en: "Achievement CE Certificate of Sterile needles and Blunt type needles" },
        { date: "2020.09", ko: "인슐린 주사기 생산 및 판매 시작", en: "Start production of Insulin Syringes" },
      ],
    },
    {
      year: "2019", img: `${imgBase}/brand/2019_products.png`,
      events: [
        { date: "2019.01", ko: "김포시 사업장 이전", en: "Move to new building in Gimpo-si" },
        { date: "2019.02", ko: "4등급 KGMP인증 획득", en: "Achievement KGMP 4th Grade" },
      ],
    },
    {
      year: "2017", img: null,
      events: [
        { date: "2017.10", ko: "메조니들, 필러캐뉼라 생산 및 판매 시작", en: "Start production of Meso needle and Filler Cannula" },
      ],
    },
    {
      year: "2016", img: null,
      events: [
        { date: "2016.08", ko: "법인전환", en: "Convert to a corporation" },
      ],
    },
    {
      year: "2011", img: `${imgBase}/brand/2011_products.png`,
      events: [
        { date: "2011.03", ko: "ISO인증 획득", en: "ISO 1st certification" },
      ],
    },
    {
      year: "2004", img: null,
      events: [
        { date: "2004.11", ko: "KGMP 의료기기 제조 허가", en: "Medical Device manufacturing business permission, KGMP" },
      ],
    },
    {
      year: "1999", img: null,
      events: [
        { date: "1999.05", ko: "용창설립", en: "Establish Yongchang company" },
      ],
    },
  ];
}


export function AboutPage() {
  const { lang, imgBase } = useLangStore();
  const { isMobile, isTablet } = useBreakpoint();
  const TIMELINE_ITEMS = getTimeline(imgBase);
  const isNarrow = isMobile || isTablet;

  /* 반응형 섹션 내부 패딩 */
  const secPad = isMobile ? "6rem 2rem" : "8.33% 3rem";

  return (
    <main className="brand">
      <div style={{ paddingBottom: 0 }}>
        <section className="brand-ceo">

          {/* ════════════════════════════════════
              1. Section Head — 회사 개요 텍스트
          ════════════════════════════════════ */}
          <div
            style={{
              background: "#fff",
            }}
          >
          <div
            style={{
              maxWidth: "150rem",
              margin: "0 auto",
              padding: isMobile ? "5rem 2rem 6rem" : isTablet ? "6rem 3rem 8rem" : "8.33% 3rem 16.5rem",
              minHeight: isMobile ? "auto" : "76rem",
              position: "relative",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: isNarrow ? "3.2rem" : "22.5rem" }}
            >
              {/* 대제목 */}
              <div style={{ flexShrink: 0 }}>
                <h2
                  style={{
                    fontSize: isNarrow ? (isMobile ? "4.6rem" : "6.4rem") : "8rem",
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: "-0.055em",
                    color: "#111",
                  }}
                >
                  <strong style={{ fontWeight: 900 }}>
                    {lang === "ko" ? (
                      <>
                        <span>주식회사</span>
                        <br />
                        <span>용창</span>
                      </>
                    ) : (
                      <>
                        <span>YONG</span>
                        <br />
                        <span>CHANG</span>
                      </>
                    )}
                  </strong>
                </h2>
              </div>

              {/* 본문 */}
              <div style={{ maxWidth: "85.2rem", width: "100%" }}>
                {lang === "ko" ? (
                  <p style={{ fontSize: "1.8rem", lineHeight: "3.2rem", wordBreak: "keep-all", color: "#777" }}>
                    <b style={{ fontWeight: 700, color: "#222" }}>(주)용창</b>은 우수한 기술력을 바탕으로 전문 의료용 주사기 및 주사침을 개발·제조하는 의료기기 전문기업입니다. 1999년 설립 이후 지속적인 연구개발을 통해 다양한 의료기기를 생산하며, 검증된 안전성과 품질을 바탕으로 의료 현장에서 신뢰받는 기업으로 성장해 왔습니다.<br /><br />
                    당사는 1등급 비멸균 주사침, 2등급 멸균 주사침, 주사기, 필러 캐뉼라, 3등급 천자침 및 4등급 봉합사에 이르기까지 폭넓은 제품군을 보유하고 있으며, 이를 통해 축적된 제조 경험과 기술력을 갖추고 있습니다.<br /><br />
                    2020년에는 <b style={{ fontWeight: 700, color: "#222" }}>COVID-19 백신용 주사기를 정부에 공급</b>하며 기술력을 공식적으로 인정받았으며, 이후 <b style={{ fontWeight: 700, color: "#222" }}>자동화 생산 라인 구축</b>을 통해 생산 효율성과 품질 안정성을 지속적으로 향상시키고 있습니다. 또한 <b style={{ fontWeight: 700, color: "#222" }}>20여 건의 특허와 45건의 디자인·상표권을 보유</b>하여 독자적인 기술 기반의 차별화된 제품을 개발하고 있습니다.<br /><br />
                    용창은 KGMP 및 ISO 13485인증을 기반으로 FDA, ANVISA, CE MDR 인증을 취득하였으며, 안전하고 우수한 품질의 의료기기를 통해 글로벌 의료기기 시장에서 신뢰받는 기업이 될 수 있도록 끊임없이 노력하겠습니다.
                  </p>
                ) : (
                  <p style={{ fontSize: "1.8rem", lineHeight: "3.2rem", wordBreak: "keep-all", color: "#777" }}>
                    <b style={{ fontWeight: 700, color: "#222" }}>YONG CHANG Co., Ltd.</b> is a specialized medical device manufacturer engaged in the development and production of medical syringes and needles based on advanced technological expertise. Since its establishment in 1999, YONG CHANG has continuously invested in research and development, delivering a wide range of medical devices that meet verified safety and quality standards and earning trust from medical professionals.<br /><br />
                    Our product portfolio includes: Class I non-sterile needles, Class II sterile needles, medical syringes, filler cannulae, Class III puncture needles, and Class IV surgical sutures. Through the production of these diverse medical devices, we have accumulated extensive manufacturing experience and technical know-how.<br /><br />
                    In 2020, YONG CHANG supplied <b style={{ fontWeight: 700, color: "#222" }}>COVID-19 vaccine syringes to the Korean government</b>, officially demonstrating its technological capabilities. Building on this achievement, we have established <b style={{ fontWeight: 700, color: "#222" }}>automated production lines</b> to further enhance manufacturing efficiency and product consistency. Additionally, we hold <b style={{ fontWeight: 700, color: "#222" }}>over 20 patents and 45 design and trademark registrations</b>, enabling us to deliver differentiated products based on proprietary technologies.<br /><br />
                    YONG CHANG is certified to <b style={{ fontWeight: 700, color: "#222" }}>KGMP and ISO 13485</b> standards and has obtained FDA registration, ANVISA approval, and CE MDR certification. With a strong commitment to safety and quality, we will continue to make every effort to become a trusted company in the global medical device market.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
          </div>

          {/* ════════════════════════════════════
              Section Contents
          ════════════════════════════════════ */}
          <div style={{ paddingTop: "1.5rem" }}>

            {/* ── 2. Overview Visual — parallax 배경 이미지 ── */}
            <div
              style={{
                padding: "15rem 0",
                backgroundImage: `url('${imgBase}/brand/overview01.jpg')`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
              }}
            >
              <div
                style={{
                  maxWidth: "144rem",
                  margin: "0 auto",
                  textAlign: "center",
                  padding: "0 2rem",
                }}
              >
                <p
                  style={{
                    marginBottom: "3rem",
                    color: "#fff",
                    fontSize: "5rem",
                    lineHeight: "3.8rem",
                  }}
                >
                  Redefining the Industry Standard
                </p>
                <p
                  style={{
                    color: "#fff",
                    fontSize: "6rem",
                    lineHeight: "8.6rem",
                    letterSpacing: "-0.2rem",
                    fontWeight: 700,
                  }}
                >
                  The World's First 35G Production Certification.
                </p>
              </div>
            </div>

            {/* ── 3. Our Values ── */}
            <div style={{ background: "#fff" }}>
              <div style={{ maxWidth: "150rem", margin: "0 auto", padding: secPad }}>
                <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: isNarrow ? "2.8rem" : "14rem" }}>

                  {/* 왼쪽: 제목 */}
                  <div style={{ flexShrink: 0 }}>
                    <h2
                      style={{
                        fontSize: isNarrow ? (isMobile ? "3.6rem" : "4.8rem") : "6.4rem",
                        fontWeight: 900,
                        lineHeight: 1.08,
                        letterSpacing: "-0.055em",
                        color: "#111",
                      }}
                    >
                      <strong style={{ whiteSpace: "pre-line", fontWeight: 900 }}>{tr(t.about.valuesTitle, lang)}</strong>
                    </h2>
                  </div>

                  {/* 오른쪽: 2×2 그리드 (가로 여백↑ · 세로 여백↓ — 운영 사이트 비율) */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      columnGap: isMobile ? 0 : "2.4rem",
                      rowGap: isMobile ? 0 : "0.5rem",
                      width: "100%",
                      maxWidth: "92rem",
                    }}
                  >
                    {/* 1 CUSTOMER FOCUS */}
                    <dl
                      style={{
                        borderBottom: "1px solid #ebebeb",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        padding: isMobile ? "12px 0 28px 0" : "4px 2rem 22px 0",
                      }}
                    >
                      <dt
                        style={{
                          fontSize: isMobile ? "2.2rem" : "2.75rem",
                          lineHeight: 1.2,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        <strong>
                          CUSTOMER <br />
                          FOCUS
                        </strong>
                      </dt>
                      <dd
                        style={{
                          fontSize: isMobile ? "1.45rem" : "1.55rem",
                          lineHeight: 1.62,
                          color: "#777",
                          wordBreak: "keep-all",
                          marginTop: "1.35rem",
                        }}
                      >
                        {lang === "en"
                          ? "Meeting Customer Expectations with Sincerity and Integrity."
                          : <>고객의 기대에 부응하며, 진실하고 성실한 <br />서비스를 제공합니다.</>}
                      </dd>
                    </dl>

                    {/* 2 RESPECT & DIVERSITY */}
                    <dl
                      style={{
                        borderBottom: "1px solid #ebebeb",
                        borderLeft: isMobile ? "none" : "1px solid #ebebeb",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        padding: isMobile ? "12px 0 28px 0" : "4px 0 22px 2.4rem",
                      }}
                    >
                      <dt
                        style={{
                          fontSize: isMobile ? "2.2rem" : "2.75rem",
                          lineHeight: 1.2,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        <strong>
                          RESPECT &amp; <br />
                          DIVERSITY
                        </strong>
                      </dt>
                      <dd
                        style={{
                          fontSize: isMobile ? "1.45rem" : "1.55rem",
                          lineHeight: 1.62,
                          color: "#777",
                          wordBreak: "keep-all",
                          marginTop: "1.35rem",
                        }}
                      >
                        {lang === "en"
                          ? "Strengthening Our Competitive Edge Through Continuous R&D and Product Diversification."
                          : <>제품의 다양화를 위해 계속해서 개발하며<br />경쟁력을 키우고 있습니다.</>}
                      </dd>
                    </dl>

                    {/* 3 INITIATIVES & INTEGRITY */}
                    <dl
                      style={{
                        borderBottom: isMobile ? "1px solid #ebebeb" : "none",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        padding: isMobile ? "20px 0 12px 0" : "22px 2rem 4px 0",
                      }}
                    >
                      <dt
                        style={{
                          fontSize: isMobile ? "2.2rem" : "2.75rem",
                          lineHeight: 1.2,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        <strong>
                          INITIATIVES &amp; <br />
                          INTEGRITY
                        </strong>
                      </dt>
                      <dd
                        style={{
                          fontSize: isMobile ? "1.45rem" : "1.55rem",
                          lineHeight: 1.62,
                          color: "#777",
                          wordBreak: "keep-all",
                          marginTop: "1.35rem",
                        }}
                      >
                        {lang === "en"
                          ? "Taking Pride in Being the Best in Our Field, Constantly Striving for Progress."
                          : <>자신의 분야에서 최고라는 자부심을 갖고 <br />끊임없이 발전을 추구합니다.</>}
                      </dd>
                    </dl>

                    {/* 4 ALIGNMENT & SYNERGY */}
                    <dl
                      style={{
                        borderBottom: "none",
                        borderLeft: isMobile ? "none" : "1px solid #ebebeb",
                        display: "flex",
                        flexDirection: "column",
                        boxSizing: "border-box",
                        padding: isMobile ? "20px 0 12px 0" : "22px 0 4px 2.4rem",
                      }}
                    >
                      <dt
                        style={{
                          fontSize: isMobile ? "2.2rem" : "2.75rem",
                          lineHeight: 1.2,
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                        }}
                      >
                        <strong>
                          ALIGNMENT &amp; <br />
                          SYNERGY
                        </strong>
                      </dt>
                      <dd
                        style={{
                          fontSize: isMobile ? "1.45rem" : "1.55rem",
                          lineHeight: 1.62,
                          color: "#777",
                          wordBreak: "keep-all",
                          marginTop: "1.35rem",
                        }}
                      >
                        {lang === "en"
                          ? "Fostering a Culture of Harmony to Deliver the Highest Quality Results Together."
                          : <>직원들과 서로 화합하며 최상의 결과물을 <br />낼 수 있도록 노력하고 있습니다.</>}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4. Timeline ── */}
            <div style={{ background: "#fff" }}>
              <div style={{ maxWidth: "150rem", margin: "0 auto", padding: isMobile ? "6rem 2rem 8rem" : "8.33% 3rem 14rem" }}>
                <div style={{ display: "flex", flexDirection: isNarrow ? "column" : "row", gap: isNarrow ? "3.2rem" : "27rem" }}>

                  {/* 왼쪽: 제목 + timeline_img */}
                  <div
                    style={{
                      flexShrink: 0,
                      position: "relative",
                      paddingBottom: isNarrow ? 0 : "120px",
                      backgroundImage: isNarrow ? "none" : `url('${imgBase}/brand/timeline_img.png')`,
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "150px",
                      backgroundPosition: "70px 270px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: isNarrow ? (isMobile ? "4.6rem" : "6.4rem") : "8rem",
                        fontWeight: 900,
                        lineHeight: 1.08,
                        letterSpacing: "-0.055em",
                        color: "#111",
                      }}
                    >
                      <strong style={{ whiteSpace: "pre-line", fontWeight: 900 }}>{tr(t.about.timelineTitle, lang)}</strong>
                    </h2>
                  </div>

                  {/* 오른쪽: 타임라인 */}
                  <div
                    style={{
                      maxWidth: "85.2rem",
                      position: "relative",
                      flex: 1,
                    }}
                  >
                    {/* 중앙 수직 선 */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: isMobile ? "100px" : "160px",
                        width: "1px",
                        backgroundColor: "#CCCCCC",
                      }}
                    />

                    {TIMELINE_ITEMS.map((item) => (
                      <div
                        key={item.year}
                        style={{
                          display: "flex",
                          position: "relative",
                          marginBottom: "60px",
                        }}
                      >
                        {/* 연도 */}
                        <div
                          style={{
                            width: isMobile ? "80px" : "120px",
                            textAlign: "right",
                            fontSize: isMobile ? "2.4rem" : "4rem",
                            lineHeight: "5.2rem",
                            fontWeight: 700,
                            paddingTop: "0",
                            flexShrink: 0,
                          }}
                        >
                          {item.year}
                        </div>

                        {/* 점 */}
                        <div
                          style={{
                            position: "absolute",
                            left: isMobile ? "91px" : "151px",
                            top: "15px",
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: "#dddddd",
                          }}
                        />

                        {/* 컨텐츠 */}
                        <div
                          style={{
                            flex: 1,
                            paddingTop: "9px",
                            paddingLeft: "80px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "20px",
                          }}
                        >
                          {/* 이벤트 목록 */}
                          <div style={{ flex: 1 }}>
                            {item.events.map((ev) => (
                              <div
                                key={ev.date}
                                style={{ marginBottom: "25px" }}
                              >
                                <div
                                  style={{
                                    fontSize: "1.8rem",
                                    lineHeight: "3.2rem",
                                    marginBottom: "4px",
                                    color: "#888",
                                  }}
                                >
                                  {ev.date}
                                </div>
                                <div
                                  style={{
                                    fontSize: "1.8rem",
                                    lineHeight: "3.2rem",
                                    fontWeight: 600,
                                    wordBreak: "keep-all",
                                    color: "#222",
                                  }}
                                >
                                  {lang === "en" ? ev.en : ev.ko}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 제품 이미지 (2024, 2019, 2011) */}
                          {item.img && (
                            <div style={{ maxWidth: "250px", flexShrink: 0 }}>
                              <img
                                src={item.img}
                                alt={`${item.year} 제품`}
                                style={{
                                  width: "100%",
                                  height: "auto",
                                  display: "block",
                                  opacity: 0.8,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end section-contents */}
        </section>
      </div>
    </main>
  );
}
