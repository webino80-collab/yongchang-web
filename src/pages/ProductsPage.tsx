import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLangStore } from "@/store/useLangStore";
import { productInfoService, productDisplayImages } from "@/lib/productInfoService";
import { pageBannerService } from "@/lib/pageBannerService";
import { productLandingService } from "@/lib/productLandingService";
import type { Product, ProductSpecRow } from "@/types";

/* ─── 폴백 (DB 비어 있을 때) ─── */
const FALLBACK: Product[] = [
  { id: "1", title_ko: "메조 니들", title_en: "MESO NEEDLES", desc_ko: "메조테라피용으로 특별히 설계된 초세밀 니들로 피부 층에 활성 성분을 정밀하게 전달합니다.", desc_en: "Ultra-fine needles specifically engineered for the precise intradermal delivery of active ingredients during mesotherapy.", image_url: null, gallery_urls: [], category: "needle", sort_order: 1, is_active: true, created_at: "", subtitle_ko: null, subtitle_en: null, summary_ko: null, summary_en: null, features_ko: ["", "", "", "", ""], features_en: ["", "", "", "", ""], detail_html_ko: null, detail_html_en: null, spec_subtype: null, spec_rows: [] },
  { id: "2", title_ko: "멀티니들", title_en: "MULTI NEEDLE", desc_ko: "초미세 가공 기술로 다중 핀 구성을 지원합니다.\n• 니들 길이 1.0mm ~ 4.0mm\n• 게이지 30G ~ 35G\n• PIN 2 / 3 / 4 구성", desc_en: "Multi-pin configuration with micro-precision engineering.\n• Needle length 1.0mm – 4.0mm\n• Gauge 30G – 35G\n• 2 / 3 / 4 pin options", image_url: null, gallery_urls: [], category: "needle", sort_order: 2, is_active: true, created_at: "", subtitle_ko: null, subtitle_en: null, summary_ko: null, summary_en: null, features_ko: ["", "", "", "", ""], features_en: ["", "", "", "", ""], detail_html_ko: null, detail_html_en: null, spec_subtype: null, spec_rows: [] },
  { id: "3", title_ko: "필러 캐뉼라", title_en: "FILLER CANNULA", desc_ko: "단일 진입점으로 넓은 영역에 정밀한 필러 전달이 가능하여 멍과 붓기를 크게 최소화합니다.", desc_en: "A single entry point allows for precise filler delivery across a wide area, significantly minimizing bruising and swelling.", image_url: null, gallery_urls: [], category: "cannula", sort_order: 3, is_active: true, created_at: "", subtitle_ko: null, subtitle_en: null, summary_ko: null, summary_en: null, features_ko: ["", "", "", "", ""], features_en: ["", "", "", "", ""], detail_html_ko: null, detail_html_en: null, spec_subtype: null, spec_rows: [] },
  { id: "4", title_ko: "OSG 캐뉼라", title_en: "OSG CANNULA", desc_ko: "조직 손상을 최소화하여 환자 통증을 경감하고 목표 층에 정확하고 안전하게 약물을 전달합니다.", desc_en: "Minimizes tissue trauma to alleviate patient pain, empowering clinicians to deliver medication accurately and safely.", image_url: null, gallery_urls: [], category: "cannula", sort_order: 4, is_active: true, created_at: "", subtitle_ko: null, subtitle_en: null, summary_ko: null, summary_en: null, features_ko: ["", "", "", "", ""], features_en: ["", "", "", "", ""], detail_html_ko: null, detail_html_en: null, spec_subtype: null, spec_rows: [] },
  { id: "5", title_ko: "척추 니들", title_en: "SPINAL NEEDLE", desc_ko: "척추 마취, 뇌척수액 채취 또는 진단 주사를 위해 지주막하 공간에 접근하도록 설계된 고정밀 니들입니다.", desc_en: "Thin, elongated, and high-precision needles specifically designed to access the subarachnoid space for spinal anesthesia.", image_url: null, gallery_urls: [], category: "anesthesia", sort_order: 5, is_active: true, created_at: "", subtitle_ko: null, subtitle_en: null, summary_ko: null, summary_en: null, features_ko: ["", "", "", "", ""], features_en: ["", "", "", "", ""], detail_html_ko: null, detail_html_en: null, spec_subtype: null, spec_rows: [] },
  { id: "6", title_ko: "경막외 니들", title_en: "EPIDURAL NEEDLE", desc_ko: "분만 또는 수술 후 통증 관리를 위해 경막외 공간에 삽입하는 두꺼운 벽의 강성 니들입니다.", desc_en: "A thick-walled, rigid needle designed for insertion into the epidural space for anesthesia or analgesia.", image_url: null, gallery_urls: [], category: "anesthesia", sort_order: 6, is_active: true, created_at: "", subtitle_ko: null, subtitle_en: null, summary_ko: null, summary_en: null, features_ko: ["", "", "", "", ""], features_en: ["", "", "", "", ""], detail_html_ko: null, detail_html_en: null, spec_subtype: null, spec_rows: [] },
];

const BROWSE_PILLS = ["all", "needle", "cannula", "anesthesia", "syringe"] as const;
type BrowsePill = (typeof BROWSE_PILLS)[number];

const LANDING_GROUPS: {
  category: Exclude<BrowsePill, "all">;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
}[] = [
  { category: "needle", titleKo: "NEEDLE", titleEn: "NEEDLE", descKo: "멸균주사침, 메조니들, 펜니들, 비이식형 혈관접속용 기구.", descEn: "Sterile syringe needles, meso needles, pen needles, and non-implantable vascular access devices." },
  { category: "cannula", titleKo: "캐뉼라", titleEn: "CANNULA", descKo: "캐뉼라, 필러캐뉼라, OSG 캐뉼라.", descEn: "Cannula, filler cannula, OSG cannula." },
  { category: "anesthesia", titleKo: "마취용 침", titleEn: "ANESTHESIA NEEDLE", descKo: "경막외투여용침, 척추마취용침.", descEn: "Epidural and spinal anesthesia needles." },
  { category: "syringe", titleKo: "주사기", titleEn: "SYRINGE", descKo: "주사기, 인슐린 주사기.", descEn: "Syringes and insulin syringes." },
];

const CATEGORY_BANNER_TITLE: Record<Exclude<BrowsePill, "all">, { ko: string; en: string }> = {
  needle: { ko: "NEEDLE", en: "NEEDLE" },
  cannula: { ko: "캐뉼라", en: "CANNULA" },
  anesthesia: { ko: "마취용 침", en: "ANESTHESIA" },
  syringe: { ko: "주사기", en: "SYRINGE" },
};

const NEEDLE_SPEC_ROWS: { gauge: string; color: string; length: string; pin: string }[] = [
  { gauge: "30G", color: "#f4d03f", length: "1mm / 1.5mm / 2mm / 4mm", pin: "2Pin / 3Pin / 4Pin" },
  { gauge: "31G", color: "#fff", length: "1mm / 1.5mm / 2mm / 4mm", pin: "2Pin / 3Pin / 4Pin" },
  { gauge: "32G", color: "#e91e8c", length: "1mm / 1.5mm / 2mm / 4mm", pin: "2Pin / 3Pin / 4Pin" },
  { gauge: "33G", color: "#ce93d8", length: "1mm / 1.5mm / 2mm / 4mm", pin: "2Pin / 3Pin / 4Pin" },
  { gauge: "34G", color: "#00bcd4", length: "1mm / 1.5mm / 2mm / 4mm", pin: "2Pin / 3Pin / 4Pin" },
  { gauge: "35G", color: "#ececec", length: "1mm / 1.5mm / 2mm / 4mm", pin: "2Pin / 3Pin / 4Pin" },
];

/** 제품 상세 규격 표 — 바깥 네 모서리 동일 라운드 */
const PRODUCT_SPEC_TABLE_RADIUS_PX = 8;

function needleSpecAsRows(): ProductSpecRow[] {
  return NEEDLE_SPEC_ROWS.map((r) => ({
    gauge: r.gauge,
    length: r.length,
    color_hex: r.color,
    wall_type: "—",
    measurement: r.pin,
  }));
}

/** 제품 상세(보기) 규격 표 4열 — 헤더는 항상 영어. 마지막 열: 타입이 전 행 동일하면 타입명(I.D.(ETW) 등), 아니면 Size */
function specPublicLastColumn(rows: ProductSpecRow[]): {
  header: string;
  formatCell: (row: ProductSpecRow) => string;
} {
  const meaningful = [
    ...new Set(
      rows
        .map((r) => r.wall_type.trim())
        .filter((w) => w.length > 0 && w !== "—")
    ),
  ];
  if (meaningful.length === 1) {
    return {
      header: meaningful[0],
      formatCell: (row) => row.measurement.trim() || "—",
    };
  }
  return {
    header: "Size",
    formatCell: (row) => {
      const wt = row.wall_type.trim();
      const m = row.measurement.trim();
      if (wt && wt !== "—") return `${wt} ${m}`.trim() || "—";
      return m || "—";
    },
  };
}

function pillLabel(value: BrowsePill, lang: string): string {
  if (value === "all") return "ALL";
  const m: Record<Exclude<BrowsePill, "all">, { ko: string; en: string }> = {
    needle: { ko: "NEEDLE", en: "NEEDLE" },
    cannula: { ko: "캐뉼라", en: "CANNULA" },
    anesthesia: { ko: "마취용 침", en: "ANESTHESIA" },
    syringe: { ko: "주사기", en: "SYRINGE" },
  };
  return lang === "ko" ? m[value].ko : m[value].en;
}

function categoryHeadlineForProduct(category: string, lang: string): string {
  const k = category as Exclude<BrowsePill, "all">;
  if (CATEGORY_BANNER_TITLE[k]) {
    return lang === "ko" ? CATEGORY_BANNER_TITLE[k].ko : CATEGORY_BANNER_TITLE[k].en;
  }
  return category.toUpperCase();
}

/* ─── 브로셔와 동일한 상단 배너 ─── */
function ProductPageBanner({
  title,
  subtitle,
  imageUrl,
}: {
  title: string;
  subtitle: string;
  imageUrl?: string | null;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: "clamp(200px, 28vw, 300px)",
        overflow: "hidden",
        backgroundColor: "#2c2c2c",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #2c2c2c 0%, #1a1a2e 100%)",
            opacity: 0.85,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 3rem",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
            {title}
          </h1>
          <p
            style={{
              fontSize: "clamp(1.3rem, 1.4vw, 1.7rem)",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.6,
              maxWidth: 560,
            }}
          >
            {subtitle}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function DefaultProductImage({ category, title }: { category: string; title: string }) {
  const color =
    category === "needle" ? "#000081" :
    category === "cannula" ? "#1a5276" :
    category === "anesthesia" ? "#1b4f72" : "#222";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${color}cc 0%, ${color} 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ opacity: 0.3 }}>
        <rect x="28" y="5" width="4" height="50" rx="2" fill="white" />
        <rect x="20" y="20" width="20" height="4" rx="2" fill="white" />
        <ellipse cx="30" cy="8" rx="4" ry="6" fill="white" opacity="0.6" />
      </svg>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.2rem", marginTop: "1rem", textAlign: "center", lineHeight: 1.4 }}>
        {title}
      </p>
    </div>
  );
}

/** 랜딩·목록 카드 호버 틴트 공통 (#3482C3 @ 80% 알파) */
const PRODUCT_CARD_HOVER_TINT = "rgba(52, 130, 195, 0.8)";

/** group 호버 시 틴트 + 흰 타이틀(텍스트는 색 전환만, opacity 미적용) */
function ProductCardHoverLayers({
  title,
  titleFontSize,
}: {
  title: string;
  titleFontSize: string;
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{ backgroundColor: PRODUCT_CARD_HOVER_TINT }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className="max-w-[90%] text-center font-extrabold uppercase leading-tight tracking-[0.1em] text-transparent transition-colors duration-300 ease-out group-hover:text-white"
          style={{ fontSize: titleFontSize }}
        >
          {title}
        </span>
      </div>
    </>
  );
}

/** 제품소개 랜딩 2×2: 호버 시 반투명 브랜드 블루 + 흰색 타이틀 */
function ProductLandingCardMedia({
  category,
  title,
  imageUrl,
}: {
  category: string;
  title: string;
  imageUrl: string | null;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-[1.2rem] bg-[#e5e5e5]" style={{ aspectRatio: "4/3" }}>
      <div className="absolute inset-0">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
        ) : (
          <DefaultProductImage category={category} title={title} />
        )}
      </div>
      <ProductCardHoverLayers title={title} titleFontSize="clamp(2.25rem, 6.5vw, 3.6rem)" />
    </div>
  );
}

function splitDescAndFeatures(desc: string | null): { intro: string; bullets: string[] } {
  if (!desc) return { intro: "", bullets: [] };
  const lines = desc.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•·*]\s?/.test(l)).map((l) => l.replace(/^[-•·*]\s?/, ""));
  const nonBullet = lines.filter((l) => !/^[-•·*]\s?/.test(l));
  const intro = nonBullet.join("\n\n") || desc;
  return { intro, bullets };
}

function BrowseProductCard({ product, lang }: { product: Product; lang: string }) {
  const title = lang === "ko" ? product.title_ko : product.title_en;
  const coverUrl = productDisplayImages(product)[0];

  return (
    <Link
      to={`/board/product/item/${product.id}`}
      className="group block"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative aspect-square overflow-hidden rounded-[1.2rem] bg-[#e8e8e8]">
          <div className="absolute inset-0">
            {coverUrl ? (
              <img src={coverUrl} alt={title ?? ""} className="h-full w-full object-cover" />
            ) : (
              <DefaultProductImage category={product.category} title={title ?? ""} />
            )}
          </div>
          <ProductCardHoverLayers
            title={title ?? ""}
            titleFontSize="clamp(1.2rem, 3.4vw, 2.05rem)"
          />
        </div>
        <p
          style={{
            marginTop: "1.2rem",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#111",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </p>
      </motion.div>
    </Link>
  );
}

/* ═══ ① 랜딩: PRODUCT + 2×2 카테고리 ═══ */
export function ProductsLandingPage() {
  const { lang } = useLangStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: banner } = useQuery({
    queryKey: ["page-banner", "product"],
    queryFn: () => pageBannerService.getBanner("product"),
  });

  const { data: landingRows } = useQuery({
    queryKey: ["product-landing-categories"],
    queryFn: async () => {
      try {
        return await productLandingService.getActive();
      } catch (e) {
        console.warn("[ProductsLandingPage] product_landing_categories:", e);
        return [];
      }
    },
  });

  const mergedLanding = useMemo(() => {
    const byCat = new Map((landingRows ?? []).map((r) => [r.category, r]));
    return LANDING_GROUPS.map((g) => {
      const r = byCat.get(g.category);
      return {
        category: g.category,
        titleKo: r?.title_ko?.trim() ? r.title_ko : g.titleKo,
        titleEn: r?.title_en?.trim() ? r.title_en : g.titleEn,
        descKo: r?.desc_ko?.trim() ? r.desc_ko : g.descKo,
        descEn: r?.desc_en?.trim() ? r.desc_en : g.descEn,
        imageUrl: r?.image_url?.trim() || null,
      };
    });
  }, [landingRows]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const sca = searchParams.get("sca");
    if (!sca) return;
    const cat = sca === "all" ? "all" : sca;
    navigate(`/board/product/browse?cat=${encodeURIComponent(cat)}`, { replace: true });
  }, [searchParams, navigate]);

  const bannerTitleKo = banner?.title_ko ?? "제품소개";
  const bannerTitleEn = banner?.title_en ?? "PRODUCT";
  const bannerSubKo = banner?.subtitle_ko ?? "혁신의 모든 순간에 안전과 신뢰의 가치를 담습니다.";
  const bannerSubEn = banner?.subtitle_en ?? "Embedding the Values of Safety and Trust in Every Innovation.";
  const headTitle = lang === "ko" ? bannerTitleKo : bannerTitleEn;
  const headSubtitle = lang === "ko" ? bannerSubKo : bannerSubEn;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f7f7" }}>
      <ProductPageBanner title={headTitle} subtitle={headSubtitle} imageUrl={banner?.image_url} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 3rem 8rem" }}>
        <div className="grid grid-cols-1 gap-[clamp(2rem,4vw,4rem)] md:grid-cols-2">
          {mergedLanding.map((g) => {
            const title = lang === "ko" ? g.titleKo : g.titleEn;
            const desc = lang === "ko" ? g.descKo : g.descEn;
            return (
              <Link
                key={g.category}
                to={`/board/product/browse?cat=${g.category}`}
                className="group block"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.45 }}
                >
                  <ProductLandingCardMedia category={g.category} title={title} imageUrl={g.imageUrl} />
                  <h2
                    style={{
                      marginTop: "1.8rem",
                      fontSize: "clamp(1.8rem, 2vw, 2.2rem)",
                      fontWeight: 800,
                      color: "#111",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {title}
                  </h2>
                  <p style={{ marginTop: "0.8rem", fontSize: "1.45rem", color: "#666", lineHeight: 1.65 }}>
                    {desc}
                  </p>
                </motion.article>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ ② 목록: 필터 + 4열 그리드 ═══ */
export function ProductsBrowsePage() {
  const { lang } = useLangStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCat = searchParams.get("cat") ?? "all";
  const activeCat: BrowsePill = BROWSE_PILLS.includes(rawCat as BrowsePill) ? (rawCat as BrowsePill) : "all";

  const { data: dbProducts } = useQuery({
    queryKey: ["products", "active"],
    queryFn: () => productInfoService.getActiveProducts(),
  });

  const { data: banner } = useQuery({
    queryKey: ["page-banner", "product"],
    queryFn: () => pageBannerService.getBanner("product"),
  });

  const allProducts = useMemo(() => (dbProducts?.length ? dbProducts : FALLBACK), [dbProducts]);

  const filtered = useMemo(() => {
    if (activeCat === "all") return allProducts;
    return allProducts.filter((p) => p.category === activeCat);
  }, [allProducts, activeCat]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeCat]);

  const bannerTitleKo = banner?.title_ko ?? "제품소개";
  const bannerTitleEn = banner?.title_en ?? "PRODUCT";
  const bannerSubKo = banner?.subtitle_ko ?? "혁신의 모든 순간에 안전과 신뢰의 가치를 담습니다.";
  const bannerSubEn = banner?.subtitle_en ?? "Embedding the Values of Safety and Trust in Every Innovation.";

  const headTitle =
    activeCat === "all"
      ? (lang === "ko" ? bannerTitleKo : bannerTitleEn)
      : (lang === "ko"
        ? CATEGORY_BANNER_TITLE[activeCat as Exclude<BrowsePill, "all">].ko
        : CATEGORY_BANNER_TITLE[activeCat as Exclude<BrowsePill, "all">].en);
  const headSubtitle = lang === "ko" ? bannerSubKo : bannerSubEn;

  const sectionTitle = lang === "ko" ? "전체 제품" : "All Products";
  const totalLabel = lang === "ko" ? `총 ${filtered.length}개` : `${filtered.length} items`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f7f7f7" }}>
      <ProductPageBanner title={headTitle} subtitle={headSubtitle} imageUrl={banner?.image_url} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 3rem 8rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "2.4rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "clamp(2rem, 2.5vw, 2.8rem)", fontWeight: 800, color: "#111", letterSpacing: "-0.03em" }}>
            {sectionTitle}
          </h2>
          <span style={{ fontSize: "1.4rem", color: "#999" }}>{totalLabel}</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.8rem", marginBottom: "3.2rem" }}>
          {BROWSE_PILLS.map((value) => {
            const isActive = activeCat === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSearchParams(value === "all" ? {} : { cat: value })}
                style={{
                  padding: "0.7rem 1.8rem",
                  fontSize: "1.4rem",
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? "#222" : "#fff",
                  color: isActive ? "#fff" : "#333",
                  border: `1px solid ${isActive ? "#222" : "#ddd"}`,
                  borderRadius: "2rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {pillLabel(value, lang)}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "8rem 0", color: "#aaa", fontSize: "1.6rem" }}>
            {lang === "ko" ? "등록된 제품이 없습니다." : "No products found."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <BrowseProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryChevron({ dir }: { dir: "prev" | "next" }) {
  const d = dir === "prev" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function ProductGallery({ product, title }: { product: Product; title: string }) {
  const images = useMemo(() => productDisplayImages(product), [product]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [product.id]);

  const n = images.length;
  const idx = n ? Math.min(activeIdx, n - 1) : 0;
  const current = images[idx];

  function goPrev() {
    if (n < 2) return;
    setActiveIdx((i) => (i - 1 + n) % n);
  }

  function goNext() {
    if (n < 2) return;
    setActiveIdx((i) => (i + 1) % n);
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "1.2rem",
        overflow: "hidden",
        backgroundColor: "#fff",
        aspectRatio: "1",
      }}
    >
      <div style={{ position: "absolute", inset: 0 }}>
        {current ? (
          <img src={current} alt={title ?? ""} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }} />
        ) : (
          <DefaultProductImage category={product.category} title={title ?? ""} />
        )}
      </div>

      {n > 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "0.65rem 0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: "transparent",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              maxWidth: "100%",
              pointerEvents: "auto",
            }}
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="이전 이미지"
              className="hover:opacity-80"
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                padding: 0,
                border: "none",
                borderRadius: 8,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3a3",
              }}
            >
              <GalleryChevron dir="prev" />
            </button>

            <div
              role="tablist"
              aria-label="갤러리 썸네일"
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: "0.45rem",
                overflowX: "auto",
                flex: 1,
                minWidth: 0,
                paddingBottom: 2,
                scrollbarWidth: "thin",
              }}
            >
              {images.map((url, i) => {
                const selected = i === idx;
                return (
                  <button
                    key={`${i}-${url}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveIdx(i)}
                    className="transition-opacity duration-200"
                    style={{
                      position: "relative",
                      flexShrink: 0,
                      width: 56,
                      height: 56,
                      padding: 0,
                      borderRadius: 10,
                      border: selected ? "1px solid #ddd" : "1px solid transparent",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "transparent",
                      opacity: selected ? 1 : 0.5,
                    }}
                  >
                    <img
                      src={url}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 10,
                        display: "block",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNext}
              aria-label="다음 이미지"
              className="hover:opacity-80"
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                padding: 0,
                border: "none",
                borderRadius: 8,
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3a3",
              }}
            >
              <GalleryChevron dir="next" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ ③ 상세 ═══ */
export function ProductDetailPage() {
  const { lang } = useLangStore();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: dbProduct, isPending } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productInfoService.getProductById(id!),
    enabled: Boolean(id),
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const fallbackMatch = useMemo(() => (id ? FALLBACK.find((p) => p.id === id) : undefined), [id]);
  const product = dbProduct ?? fallbackMatch ?? null;

  useEffect(() => {
    if (!id || isPending) return;
    if (!product) {
      navigate("/board/product/browse", { replace: true });
    }
  }, [id, isPending, product, navigate]);

  if (isPending && !fallbackMatch) {
    return (
      <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        {lang === "ko" ? "불러오는 중…" : "Loading…"}
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const title = lang === "ko" ? product.title_ko : product.title_en;
  const subtitle = lang === "ko" ? product.subtitle_ko : product.subtitle_en;
  const summarySrc = lang === "ko" ? (product.summary_ko ?? product.desc_ko) : (product.summary_en ?? product.desc_en);
  const { intro, bullets } = splitDescAndFeatures(summarySrc);
  const defaultBulletsKo = [
    "니들 길이 1.0mm ~ 4.0mm (품목별 상이)",
    "게이지 30G ~ 35G",
    "PIN 2 / 3 / 4 구성",
    "초정밀 가공으로 의료 현장의 요구에 맞춥니다.",
  ];
  const defaultBulletsEn = [
    "Needle length 1.0mm – 4.0mm (varies by SKU)",
    "Gauge 30G – 35G",
    "2 / 3 / 4 pin configurations",
    "Micro-precision manufacturing for clinical needs.",
  ];
  const fromFeat = (lang === "ko" ? product.features_ko : product.features_en).filter((x) => x.trim());
  const featureList =
    fromFeat.length >= 1 ? fromFeat : bullets.length >= 2 ? bullets : (lang === "ko" ? defaultBulletsKo : defaultBulletsEn);

  const detailHtml = lang === "ko" ? product.detail_html_ko : product.detail_html_en;

  const specRowsForTable: ProductSpecRow[] =
    product.spec_rows.length > 0
      ? product.spec_rows
      : product.category === "needle"
        ? needleSpecAsRows()
        : [];

  const specSterileLayout = product.spec_subtype === "sterile";
  const specLast = specSterileLayout ? null : specPublicLastColumn(specRowsForTable);
  const specPublicHeaders = specSterileLayout
    ? (["Gauge", "Color", "Length"] as const)
    : (["Gauge", "Color", "Length", specLast!.header] as const);

  const listHref = `/board/product/browse?cat=${encodeURIComponent(product.category)}`;
  const catHeadline = categoryHeadlineForProduct(product.category, lang);

  const taglineKo = "(주)용창의 한계를 뛰어넘는 초정밀 기술력으로 의료 현장의 해답이 되겠습니다.";
  const taglineEn = "With precision beyond limits, Yongchang supports every clinical challenge.";
  const tagline = lang === "ko" ? taglineKo : taglineEn;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      {/* 헤더·갤러리·표가 동일한 좌우 inset(패딩)을 쓰도록 한 컨테이너로 통일 */}
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-24 pt-12 md:px-12">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "2rem",
            flexWrap: "wrap",
          }}
          className="pb-6"
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(2.4rem, 3.5vw, 3.6rem)",
                fontWeight: 900,
                color: "#111",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "1rem",
                lineHeight: 1.1,
              }}
            >
              {catHeadline}
            </h1>
            <p style={{ fontSize: "1.45rem", color: "#777", lineHeight: 1.65, maxWidth: 520 }}>{tagline}</p>
          </div>
          <Link
            to={listHref}
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "#111",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              marginTop: "0.4rem",
            }}
            className="hover:opacity-70"
          >
            {lang === "ko" ? "목록" : "List"}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 items-start gap-[clamp(2rem,4vw,4rem)] pt-8 lg:grid-cols-2">
        <ProductGallery product={product} title={title ?? ""} />

        {/* 본문 */}
        <div style={{ marginTop: 50 }}>
          <h2 style={{ fontSize: "clamp(2rem, 2.2vw, 2.4rem)", fontWeight: 800, color: "#111", marginBottom: subtitle ? "0.5rem" : "1.2rem" }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: "1.35rem", color: "#888", marginBottom: "1.2rem", lineHeight: 1.5 }}>{subtitle}</p>
          )}
          {intro && (
            <p style={{ fontSize: "1.45rem", color: "#666", lineHeight: 1.75, marginBottom: "2rem" }}>{intro}</p>
          )}

          {detailHtml && (
            <div
              className="product-detail-html mb-8 [&_img]:max-w-full [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6"
              style={{ fontSize: "1.45rem", lineHeight: 1.75, color: "#444" }}
              dangerouslySetInnerHTML={{ __html: detailHtml }}
            />
          )}

          <div
            className="product-feature-bullets"
            style={{
              border: "1px dashed #c8c8c8",
              borderRadius: "0.8rem",
              padding: "1.5rem 1.75rem",
              backgroundColor: "#fff",
              marginBottom: "2.4rem",
            }}
          >
            <ul style={{ fontSize: "1.38rem", color: "#333", lineHeight: 1.75 }}>
              {featureList.map((line, i) => (
                <li key={`${i}-${line.slice(0, 24)}`}>{line}</li>
              ))}
            </ul>
          </div>

          <Link
            to="/contact"
            style={{
              display: "inline-block",
              padding: "0.9rem 2.8rem",
              borderRadius: "999px",
              border: "1px solid #111",
              fontSize: "1.45rem",
              fontWeight: 600,
              color: "#111",
              textDecoration: "none",
              transition: "background 0.2s, color 0.2s",
            }}
            className="hover:bg-[#111] hover:!text-white"
          >
            {lang === "ko" ? "제품 문의" : "Product Inquiry"}
          </Link>
        </div>

        {/* 규격 표: 상단 NEEDLE·갤러리와 동일한 그리드 좌측 패딩 기준선에 맞춤 (lg에서 전체 폭 행) */}
        {specRowsForTable.length > 0 && (
          <div
            className="col-span-1 w-full lg:col-span-2"
            style={{ marginTop: "clamp(2.5rem, 5vw, 4rem)", paddingBottom: "clamp(2rem, 4vw, 3rem)" }}
          >
            <div style={{ overflowX: "auto" }}>
              <div
                style={{
                  width: "100%",
                  borderRadius: PRODUCT_SPEC_TABLE_RADIUS_PX,
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: specSterileLayout ? 360 : 520,
                    borderCollapse: "collapse",
                    borderSpacing: 0,
                    fontSize: "1.4rem",
                    fontFamily: "inherit",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#333333", color: "#fff" }}>
                      {specPublicHeaders.map((h, hi) => (
                        <th
                          key={`${hi}-${h}`}
                          style={{
                            padding: "1rem 1.35rem",
                            textAlign: "left",
                            fontWeight: 700,
                            fontSize: "1.35rem",
                            letterSpacing: "0.02em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {specRowsForTable.map((row, ri) => {
                      const c = row.color_hex || "#ccc";
                      const isLast = ri === specRowsForTable.length - 1;
                      const lightSwatch =
                        c === "#fff" ||
                        c === "#ffffff" ||
                        c === "#ececec" ||
                        c.toLowerCase() === "#ffffff";
                      return (
                        <tr
                          key={`${row.gauge}-${ri}`}
                          style={{
                            backgroundColor: "#fff",
                            borderBottom: isLast ? "none" : "1px solid #e8e8e8",
                          }}
                        >
                          <td
                            style={{
                              padding: "1rem 1.35rem",
                              fontWeight: 600,
                              color: "#4a4a4a",
                              verticalAlign: "middle",
                            }}
                          >
                            {row.gauge}
                          </td>
                          <td style={{ padding: "1rem 1.35rem", verticalAlign: "middle" }}>
                            <span
                              style={{
                                display: "block",
                                width: 48,
                                height: 15,
                                backgroundColor: c,
                                border: lightSwatch ? "1px solid #c5c5c5" : "none",
                                borderRadius: 4,
                                verticalAlign: "middle",
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: "1rem 1.35rem",
                              color: "#555",
                              verticalAlign: "middle",
                              lineHeight: 1.5,
                            }}
                          >
                            {row.length}
                          </td>
                          {!specSterileLayout && specLast ? (
                            <td
                              style={{
                                padding: "1rem 1.35rem",
                                color: "#555",
                                verticalAlign: "middle",
                                lineHeight: 1.5,
                              }}
                            >
                              {specLast.formatCell(row)}
                            </td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
