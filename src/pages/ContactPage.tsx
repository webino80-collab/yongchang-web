import { useEffect, useState } from "react";
import { useLangStore } from "@/store/useLangStore";
import { ContactForm } from "@/components/contact/ContactForm";

/** 문의 페이지 지도·주소 표기에 공통 사용 */
const COMPANY_ADDRESS_KO = "경기도 김포시 양촌읍 황금로 292번길 16";
const COMPANY_ADDRESS_EN = "292-16, Hwanggeum-ro, Yangchon-eup, Gimpo-si";

/**
 * 임베드 URL
 * - VITE_GOOGLE_MAPS_EMBED_API_KEY 가 있으면 공식 Embed API(place) 사용(권장)
 * - 없으면 도로명 주소 전체를 q= 로 전달해 핀·라벨이 "경기도 김포시 양촌읍 황금로 292번길 16"과 일치하도록 함
 */
function contactMapEmbedSrc(lang: "ko" | "en"): string {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY as string | undefined)?.trim();
  const q = lang === "ko" ? COMPANY_ADDRESS_KO : COMPANY_ADDRESS_EN;
  if (key) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(q)}&zoom=17&language=${lang === "ko" ? "ko" : "en"}`;
  }
  const hl = lang === "ko" ? "ko" : "en";
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=17&hl=${hl}&output=embed`;
}

function googleMapsOpenUrlForLang(lang: "ko" | "en"): string {
  const q = lang === "ko" ? COMPANY_ADDRESS_KO : COMPANY_ADDRESS_EN;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Static Maps — 임베드보다 가볍게 먼저 그려 체감 속도 개선 (동일 API 키, 콘솔에서 Static Maps API 활성화 필요) */
function contactStaticMapSrc(lang: "ko" | "en"): string | null {
  const key = (import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY as string | undefined)?.trim();
  if (!key) return null;
  const q = lang === "ko" ? COMPANY_ADDRESS_KO : COMPANY_ADDRESS_EN;
  const center = encodeURIComponent(q);
  const hl = lang === "ko" ? "ko" : "en";
  return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=17&size=640x360&scale=2&maptype=roadmap&markers=color:0xea4335%7C${center}&key=${encodeURIComponent(key)}&language=${hl}`;
}

const MAP_PRECONNECTS = [
  "https://www.google.com",
  "https://maps.gstatic.com",
  "https://maps.googleapis.com",
] as const;

export function ContactPage() {
  const { lang } = useLangStore();
  const langUi = lang === "en" ? "en" : "ko";
  const mapSrc = contactMapEmbedSrc(langUi);
  const staticMapSrc = contactStaticMapSrc(langUi);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [staticMapFailed, setStaticMapFailed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setIframeLoaded(false);
    setStaticMapFailed(false);
  }, [mapSrc, staticMapSrc]);

  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    for (const href of MAP_PRECONNECTS) {
      const el = document.createElement("link");
      el.rel = "preconnect";
      el.href = href;
      document.head.appendChild(el);
      links.push(el);
    }
    return () => {
      for (const el of links) el.remove();
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>

      {/* ════════════════════════════════
          1. 풀-와이드 지도 (Google Maps)
      ════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(220px, 32vw, 380px)",
          overflow: "hidden",
          backgroundColor: "#e8eaed",
        }}
      >
        {staticMapSrc && !staticMapFailed && (
          <img
            src={staticMapSrc}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={() => setStaticMapFailed(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              zIndex: 0,
              opacity: iframeLoaded ? 0 : 1,
              transition: "opacity 0.35s ease",
              pointerEvents: "none",
            }}
          />
        )}
        {!iframeLoaded && (!staticMapSrc || staticMapFailed) && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(160deg, #e8eef5 0%, #dfe6ee 45%, #e8eaed 100%)",
            }}
          >
            <div
              style={{
                width: "2.8rem",
                height: "2.8rem",
                borderRadius: "50%",
                border: "3px solid rgba(26,115,232,0.25)",
                borderTopColor: "#1a73e8",
                animation: "spin 0.75s linear infinite",
              }}
            />
          </div>
        )}
        <iframe
          key={mapSrc}
          src={mapSrc}
          title={lang === "ko" ? "회사 위치 — Google 지도" : "Company location — Google Maps"}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIframeLoaded(true)}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            opacity: iframeLoaded ? 1 : 0,
            transition: "opacity 0.35s ease",
            pointerEvents: iframeLoaded ? "auto" : "none",
          }}
          allowFullScreen
        />
        <a
          href={googleMapsOpenUrlForLang(langUi)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            zIndex: 3,
            fontSize: "1.2rem",
            fontWeight: 600,
            color: "#1a73e8",
            backgroundColor: "rgba(255,255,255,0.95)",
            padding: "0.5rem 0.9rem",
            borderRadius: "0.4rem",
            textDecoration: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          {lang === "ko" ? "Google 지도에서 열기" : "Open in Google Maps"}
        </a>
        {/* 임베드 지도 위 회사명 말풍선(오버레이). 지도 조작은 iframe으로 통과하도록 pointer-events 없음 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "42%",
            transform: "translate(-50%, -100%)",
            zIndex: 2,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              color: "#111",
              fontSize: "clamp(1.25rem, 1.35vw, 1.42rem)",
              fontWeight: 800,
              padding: "0.55rem 1.15rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              whiteSpace: "nowrap",
              letterSpacing: "-0.02em",
            }}
          >
            {lang === "ko" ? "주식회사 용창" : "Yongchang Co., Ltd."}
          </div>
          <div
            aria-hidden
            style={{
              width: 0,
              height: 0,
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              borderTop: "10px solid #fff",
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.08))",
              marginTop: "-1px",
            }}
          />
          <div
            aria-hidden
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: "#ea4335",
              border: "2px solid #fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              marginTop: 3,
            }}
          />
        </div>
      </div>

      {/* ════════════════════════════════
          2. 회사 연락처 정보
      ════════════════════════════════ */}
      <section style={{ backgroundColor: "#fff", padding: "6rem 2rem 5rem" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>

          {/* 헤드라인 */}
          <h2
            style={{
              fontSize: "clamp(2.6rem, 3.5vw, 3.8rem)",
              fontWeight: 800,
              color: "#111",
              letterSpacing: "-0.04em",
              lineHeight: 1.3,
              marginBottom: "4.8rem",
            }}
          >
            {lang === "ko"
              ? <>언제나 고객님과 함께하는<br />주식회사 용창 되겠습니다.</>
              : <>Always together with our customers,<br />Yongchang Co., Ltd.</>}
          </h2>

          {/* 연락처: 모바일 1열 · md 이상 2분할 */}
          <div className="grid w-full grid-cols-1 gap-10 md:grid-cols-2 md:items-stretch md:gap-x-12 md:gap-y-0">
            {/* ── 좌: 연락처/주소 ── */}
            <div className="flex h-full min-w-0 items-center gap-8">
              <span
                style={{
                  width: "5.2rem", height: "5.2rem", borderRadius: "50%",
                  backgroundColor: "#1565c0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                    fill="white"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "1.5rem", color: "#222", lineHeight: 1.85, fontWeight: 500 }}>
                  {lang === "ko" ? COMPANY_ADDRESS_KO : COMPANY_ADDRESS_EN}
                  <br />
                  Tel 031-989-8311 · Fax 031-985-8312
                  <br />
                  Email ycpbm@hanmail.net
                </p>
              </div>
            </div>

            {/* ── 우: 운영시간 ── */}
            <div className="flex h-full min-w-0 items-center gap-8">
              <span
                style={{
                  width: "5.2rem", height: "5.2rem", borderRadius: "50%",
                  backgroundColor: "#1565c0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 14L11 13.24V7h1.5v5.52l4.74 2.74-.51.74z"
                    fill="white"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p style={{ fontSize: "1.5rem", color: "#222", lineHeight: 1.85, fontWeight: 500 }}>
                  {lang === "ko" ? (
                    <>
                      오전 08:30 – 오후 18:00<br />
                      (점심시간 12:00~13:00 제외)<br />
                      토, 일요일 및 법정 공휴일 제외
                    </>
                  ) : (
                    <>
                      08:30 AM – 06:00 PM<br />
                      (Lunch: 12:00~13:00 excluded)<br />
                      Closed on weekends & holidays
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          3. 문의 폼 (회색 배경)
      ════════════════════════════════ */}
      <section style={{ backgroundColor: "#f5f5f5", padding: "7rem 2rem 8rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>

          {/* 폼 헤더 */}
          <div style={{ marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "clamp(2.2rem, 3vw, 3.2rem)",
                fontWeight: 800, color: "#111",
                letterSpacing: "-0.04em", lineHeight: 1.3,
                marginBottom: "1.2rem",
              }}
            >
              {lang === "ko"
                ? <>문의하시는 분의 정보와<br />내용을 입력해주세요.</>
                : <>Please enter your information<br />and inquiry details.</>}
            </h2>
            <p style={{ fontSize: "1.4rem", color: "#777", lineHeight: 1.7 }}>
              {lang === "ko"
                ? "문의하신 내용의 빠른 답변 진행하여 아래의 양식대로 상세히 입력하여 작성해 주세요."
                : "For a prompt response, please fill in all fields below with detailed information."}
            </p>
          </div>

          <ContactForm lang={lang} />
        </div>
      </section>
    </div>
  );
}
