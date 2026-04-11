import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { useLangStore } from "@/store/useLangStore";
import {
  certificateService,
  CERT_TYPES,
  CERT_PAGE_TAB_VALUES,
} from "@/lib/certificateService";
import { pageBannerService } from "@/lib/pageBannerService";
import type { Certificate } from "@/types";

const PER_PAGE = 12;

const DEFAULT_HERO_KO =
  "용창의 기술이 닿는 모든 곳에, 안전과 신뢰라는 가치를 심습니다.";
const DEFAULT_HERO_EN =
  "We embed the values of safety and trust wherever Yongchang technology reaches.";
/** page_banners 시드와 동일 — DB 비어 있을 때만 */
const DEFAULT_BANNER_TITLE_KO = "특허 & 인증";
const DEFAULT_BANNER_TITLE_EN = "Patents & Certifications";

/** 그리드 썸네일 — 배경 없이 이미지 + 하단 제목 (클릭·확대 없음) */
function GalleryThumb({ cert }: { cert: Certificate }) {
  const { lang } = useLangStore();
  const title = lang === "ko" ? cert.title_ko : (cert.title_en ?? cert.title_ko);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.35 }}
      className="flex w-full flex-col items-center text-center"
    >
      <div className="flex aspect-[3/4] w-full max-w-[200px] items-center justify-center">
        {cert.image_url ? (
          <img
            src={cert.image_url}
            alt={title}
            className="max-h-full max-w-full object-contain drop-shadow-sm"
          />
        ) : (
          <div className="text-xs text-gray-400">{lang === "ko" ? "이미지 없음" : "No image"}</div>
        )}
      </div>
      <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-sm font-medium leading-snug text-gray-900">
        {title}
      </p>
    </motion.article>
  );
}

export function CertificatePage() {
  const { lang } = useLangStore();
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: certs } = useQuery({
    queryKey: ["certificates", "active"],
    queryFn: () => certificateService.getActiveCertificates(),
  });

  const { data: banner } = useQuery({
    queryKey: ["page-banner", "certificate"],
    queryFn: () => pageBannerService.getBanner("certificate"),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterType]);

  const displayCerts = certs?.length ? certs : [];

  const filtered = useMemo(() => {
    if (filterType === "all") return displayCerts;
    return displayCerts.filter((c) => c.cert_type === filterType);
  }, [displayCerts, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const filterTabs = useMemo(() => {
    const rest = CERT_PAGE_TAB_VALUES.map((value) => {
      const t = CERT_TYPES.find((x) => x.value === value)!;
      return {
        value,
        label: lang === "ko" ? t.labelKo : t.labelEn,
      };
    });
    return [{ value: "all", label: lang === "ko" ? "전체" : "All" }, ...rest];
  }, [lang]);

  const sectionHeading =
    filterType === "all"
      ? lang === "ko"
        ? "전체 특허&인증"
        : "All Patents & Certifications"
      : CERT_TYPES.find((t) => t.value === filterType)?.[lang === "ko" ? "labelKo" : "labelEn"] ?? filterType;

  const bannerTitleKo = banner?.title_ko?.trim() || DEFAULT_BANNER_TITLE_KO;
  const bannerTitleEn = banner?.title_en?.trim() || DEFAULT_BANNER_TITLE_EN;
  const headTitle = lang === "ko" ? bannerTitleKo : bannerTitleEn;

  const heroSubtitle =
    lang === "ko"
      ? (banner?.subtitle_ko ?? DEFAULT_HERO_KO)
      : (banner?.subtitle_en ?? DEFAULT_HERO_EN);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f7f7" }}>
      {/* 서브 배너 — 브로셔와 동일 높이 clamp(200px, 28vw, 300px) */}
      <section
        className="relative w-full overflow-hidden bg-[#2c2c2c]"
        style={{ height: "clamp(200px, 28vw, 300px)" }}
      >
        {banner?.image_url ? (
          <>
            <img
              src={banner.image_url}
              alt={headTitle}
              className="absolute inset-0 h-full w-full object-cover opacity-[0.55]"
            />
            {/* 브로셔 배너와 동일 오버레이 */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 100%)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f2d52] to-slate-950"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.08), transparent)",
            }}
          />
        )}

        <div
          className="relative z-10 mx-auto flex h-full max-w-[1200px] flex-col justify-center text-left"
          style={{ paddingLeft: "3rem", paddingRight: "3rem" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              style={{
                fontSize: "clamp(2.8rem, 4vw, 5rem)",
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: "1.2rem",
                lineHeight: 1.1,
              }}
            >
              {headTitle}
            </h1>
            <p
              style={{
                fontSize: "clamp(1.3rem, 1.4vw, 1.7rem)",
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.6,
                maxWidth: 560,
              }}
            >
              {heroSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* 본문 — 브로셔 페이지와 동일 여백 */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 3rem 8rem" }}>
        {/* 섹션 헤더 — 브로셔 페이지와 동일 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2.4rem",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(2rem, 2.5vw, 2.8rem)",
              fontWeight: 800,
              color: "#111",
              letterSpacing: "-0.03em",
            }}
          >
            {sectionHeading}
          </h2>
          <span style={{ fontSize: "1.4rem", color: "#999" }}>
            {lang === "ko" ? `총 ${filtered.length}건` : `${filtered.length} items`}
          </span>
        </div>

        {/* 필터 필 — 제품소개 browse 필터와 동일 크기·스타일 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginBottom: "3.2rem" }}>
          {filterTabs.map((tab) => {
            const active = filterType === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilterType(tab.value)}
                style={{
                  padding: "0.7rem 1.8rem",
                  fontSize: "1.4rem",
                  fontWeight: active ? 700 : 500,
                  backgroundColor: active ? "#222" : "#fff",
                  color: active ? "#fff" : "#333",
                  border: `1px solid ${active ? "#222" : "#ddd"}`,
                  borderRadius: "2rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", padding: "8rem 0", color: "#aaa", fontSize: "1.6rem" }}>
            {displayCerts.length === 0
              ? lang === "ko"
                ? "등록된 인증이 없습니다."
                : "No certifications registered."
              : lang === "ko"
                ? "해당 분류에 인증이 없습니다."
                : "No certifications in this category."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
              {pageSlice.map((cert) => (
                <GalleryThumb key={cert.id} cert={cert} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2"
                aria-label={lang === "ko" ? "페이지" : "Pagination"}
              >
                {safePage > 1 && (
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-gray-600 hover:bg-gray-100"
                  >
                    ‹
                  </button>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition",
                      safePage === n
                        ? "bg-[#1e40af] text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {n}
                  </button>
                ))}
                {safePage < totalPages && (
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-gray-600 hover:bg-gray-100"
                  >
                    ›
                  </button>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
