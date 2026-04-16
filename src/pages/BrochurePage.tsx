import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLangStore } from "@/store/useLangStore";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { brochureService } from "@/lib/brochureService";
import { pageBannerService } from "@/lib/pageBannerService";
import type { Brochure } from "@/types";

/* ─── 카테고리 목록 ─── */
const CATEGORIES = {
  ko: ["전체", "제품 카탈로그", "회사 소개서", "제품 기술문서", "기타"],
  en: ["All", "Product Catalog", "Company Profile", "Technical Document", "Other"],
};
const CATEGORY_MAP: Record<string, string> = {
  "전체": "All",
  "제품 카탈로그": "Product Catalog",
  "회사 소개서": "Company Profile",
  "제품 기술문서": "Technical Document",
  "기타": "Other",
};

/* ─── 다운로드 핸들러 ─── */
function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.click();
}

/* ─── 브로셔 카드 (가로형) ─── */
function BrochureCard({ b, lang }: { b: Brochure; lang: string }) {
  const title    = lang === "ko" ? b.title_ko : (b.title_en ?? b.title_ko);
  const category = lang === "ko" ? b.category : (CATEGORY_MAP[b.category] ?? b.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      style={{
        display: "flex",
        alignItems: "stretch",
        backgroundColor: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: "0.8rem",
        overflow: "hidden",
        transition: "box-shadow 0.25s",
      }}
      className="hover:shadow-md"
    >
      {/* 썸네일 */}
      <div
        style={{
          width: 140,
          flexShrink: 0,
          /* 썸네일 URL 있을 때: 로딩 전 파란 톤 박스가 비치지 않도록 흰 배경 */
          backgroundColor: b.cover_image_url ? "#fff" : "#f0f4f8",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {b.cover_image_url ? (
          <img
            src={b.cover_image_url}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)",
              minHeight: 110,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="2" width="28" height="36" rx="3" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1.5"/>
              <rect x="6" y="2" width="28" height="7" rx="3" fill="#3b82f6"/>
              <path d="M12 17h16M12 22h16M12 27h10" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* 텍스트 영역 */}
      <div
        style={{
          flex: 1, padding: "1.6rem 2rem",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          minWidth: 0,
        }}
      >
        <div>
          <p
            style={{
              fontSize: "1.2rem", fontWeight: 600, color: "#1565c0",
              marginBottom: "0.6rem",
            }}
          >
            {category}
          </p>
          <h3
            style={{
              fontSize: "1.6rem", fontWeight: 700, color: "#111",
              letterSpacing: "-0.02em", lineHeight: 1.4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {title}
          </h3>
        </div>

        {/* 다운로드 */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.2rem" }}>
          <button
            onClick={() => {
              if (!b.file_url) {
                alert(lang === "ko" ? "다운로드 파일이 준비 중입니다." : "File is not ready yet.");
                return;
              }
              downloadFile(b.file_url, title);
            }}
            title={lang === "ko" ? "다운로드" : "Download"}
            style={{
              width: "3.2rem", height: "3.2rem",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #ddd", borderRadius: "50%",
              backgroundColor: b.file_url ? "#fff" : "#f3f4f6",
              cursor: b.file_url ? "pointer" : "not-allowed",
              color: b.file_url ? "#1565c0" : "#ccc",
              transition: "background 0.2s, border-color 0.2s",
            }}
            className={b.file_url ? "hover:bg-blue-50 hover:border-blue-300" : ""}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── 페이지 ─── */
export function BrochurePage() {
  const { lang } = useLangStore();
  const { isMobile } = useBreakpoint();
  const [activeCategory, setActiveCategory] = useState("전체");

  const { data: brochures } = useQuery({
    queryKey: ["brochures", "active"],
    queryFn: () => brochureService.getActiveBrochures(),
  });

  const { data: banner } = useQuery({
    queryKey: ["page-banner", "brochure"],
    queryFn: () => pageBannerService.getBanner("brochure"),
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const categories = CATEGORIES[lang as "ko" | "en"] ?? CATEGORIES.ko;
  const displayBrochures = brochures ?? [];

  const filtered =
    activeCategory === "전체" || activeCategory === "All"
      ? displayBrochures
      : displayBrochures.filter((b) => {
          if (lang === "en") {
            return CATEGORY_MAP[b.category] === activeCategory;
          }
          return b.category === activeCategory;
        });

  /* 배너 기본값 */
  const bannerTitle    = banner?.title_ko    ?? "브로셔";
  const bannerSubtitle = banner?.subtitle_ko ?? "용창의 기술이 닿는 모든 곳에, 안전과 신뢰라는 가치를 심습니다.";
  const bannerTitleEn    = banner?.title_en    ?? "BROCHURE";
  const bannerSubtitleEn = banner?.subtitle_en ?? "Wherever Yongchang technology reaches, safety and trust take root.";

  const headTitle    = lang === "ko" ? bannerTitle    : bannerTitleEn;
  const headSubtitle = lang === "ko" ? bannerSubtitle : bannerSubtitleEn;

  const sectionTitle = lang === "ko" ? "전체 브로셔" : "All Brochures";
  const totalLabel   = lang === "ko" ? `총 ${displayBrochures.length}건` : `${displayBrochures.length} items`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f7f7" }}>

      {/* ─── 상단 배너 ─── */}
      <div
        style={{
          position: "relative",
          height: "clamp(200px, 28vw, 300px)",
          overflow: "hidden",
          backgroundColor: "#2c2c2c",
        }}
      >
        {/* 배경 이미지 */}
        {banner?.image_url ? (
          <img
            src={banner.image_url}
            alt={headTitle}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: 0.55,
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #2c2c2c 0%, #1a1a2e 100%)",
              opacity: 0.85,
            }}
          />
        )}

        {/* 오버레이 */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        {/* 텍스트 */}
        <div
          style={{
            position: "relative", zIndex: 1,
            maxWidth: 1200, margin: "0 auto",
            padding: isMobile ? "0 2rem" : "0 3rem",
            height: "100%",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}
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
              {headSubtitle}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ─── 본문 ─── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: isMobile ? "5rem 2rem 8rem" : "5rem 3rem 8rem",
        }}
      >

        {/* 섹션 헤더 */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "2.4rem",
          }}
        >
          <h2 style={{ fontSize: "clamp(2rem, 2.5vw, 2.8rem)", fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>
            {sectionTitle}
          </h2>
          <span style={{ fontSize: "1.4rem", color: "#999" }}>{totalLabel}</span>
        </div>

        {/* 카테고리 탭 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginBottom: "3.2rem" }}>
          {categories.map((cat) => {
            const isActive = cat === activeCategory ||
              (cat === "전체" && activeCategory === "All") ||
              (cat === "All" && activeCategory === "전체");
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "0.7rem 1.8rem",
                  fontSize: "1.4rem",
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "#222" : "#fff",
                  color: isActive ? "#fff" : "#555",
                  border: `1px solid ${isActive ? "#222" : "#ddd"}`,
                  borderRadius: "2rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 브로셔 그리드 */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "8rem 0", color: "#aaa", fontSize: "1.6rem" }}>
            {displayBrochures.length === 0
              ? (lang === "ko" ? "등록된 브로셔가 없습니다." : "No brochures registered.")
              : (lang === "ko" ? "해당 카테고리에 브로셔가 없습니다." : "No brochures in this category.")}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
              gap: "2rem",
            }}
          >
            {filtered.map((b) => (
              <BrochureCard key={b.id} b={b} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
