import { useState, useRef, useEffect, useMemo, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLangStore } from "@/store/useLangStore";
import { t, tr, type Lang } from "@/i18n/translations";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { visualService } from "@/lib/visualService";
import { homeRollingService } from "@/lib/homeRollingService";
import { productService } from "@/lib/productService";
import type { HeroSlide, HomeProduct, HomeRollingSlide } from "@/types";

const PRIMARY = "#000081";
const ACCENT  = "#00b4d6";

/** 메인 히어로: 이미지 4슬롯 + 하단 타임라인 진행 */
const HERO_TIMELINE_SLOTS = 4;
const HERO_AUTO_MS = 8000;
/** setState 과다 방지 — 진행률이 이 정도 이상 변할 때만 리렌더 */
const HERO_PROGRESS_EPS = 0.004;
/** 히어로 배경 크로스페이드 (초) */
const HERO_BG_FADE_SEC = 0.55;
const HERO_MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** 히어로 아래 롤링: 모바일 스와이프 최소 거리(px), 세로 스크롤과 구분 비율 */
const ROLLING_SWIPE_MIN_PX = 50;
const ROLLING_SWIPE_DOMINANCE = 1.15;

/** Layout 고정 헤더와 맞춤 — 본문이 헤더 아래·타임라인 위 구간 안에 오도록 (+3rem ≈ 30px 아래로) */
const HERO_PAD_TOP_PC =
  "calc(12rem + 3rem + env(safe-area-inset-top, 0px))"; /* HEADER_H_PC 120px */
const HERO_PAD_TOP_MOBILE =
  "calc(7rem + 3rem + env(safe-area-inset-top, 0px))"; /* HEADER_H_MOBILE 60px + 여유 */

function normalizeHeroSlidesToFour(slides: HeroSlide[]): HeroSlide[] {
  const sorted = [...slides]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, HERO_TIMELINE_SLOTS);
  if (sorted.length === 0) {
    return Array.from({ length: HERO_TIMELINE_SLOTS }, (_, i) => ({
      id: `hero-placeholder-${i}`,
      image_url: "",
      main_text: "",
      main_text_en: null,
      sub_text: null,
      sub_text_en: null,
      sort_order: i,
      is_active: true,
      created_at: "",
    }));
  }
  const out = [...sorted];
  const last = out[out.length - 1];
  while (out.length < HERO_TIMELINE_SLOTS) {
    out.push({
      ...last,
      id: `${last.id}-pad-${out.length}`,
      sort_order: out.length,
    });
  }
  return out;
}

function heroSegmentFillWidth(
  segmentIndex: number,
  activeIndex: number,
  progress01: number
): string {
  if (segmentIndex < activeIndex) return "100%";
  if (segmentIndex > activeIndex) return "0%";
  return `${Math.max(0, Math.min(1, progress01)) * 100}%`;
}

/** 첫 줄바꿈 기준 두 줄 (히어로 메인·서브 공통) */
function splitHeroLines(text: string): [string, string] {
  const s = text.trim();
  const n = s.indexOf("\n");
  if (n === -1) return [s, ""];
  return [s.slice(0, n).trim(), s.slice(n + 1).trim()];
}

function heroMainLinesFromSlide(
  slide: HeroSlide | undefined,
  lang: Lang
): [string, string] | null {
  if (!slide) return null;
  const ko = slide.main_text?.trim() ?? "";
  const en = slide.main_text_en?.trim() ?? "";
  const pick = lang === "en" ? en || ko : ko || en;
  if (!pick) return null;
  return splitHeroLines(pick);
}

function heroSubLinesFromSlide(
  slide: HeroSlide | undefined,
  lang: Lang
): [string, string] | null {
  if (!slide) return null;
  const ko = slide.sub_text?.trim() ?? "";
  const en = slide.sub_text_en?.trim() ?? "";
  const pick = lang === "en" ? en || ko : ko || en;
  if (!pick) return null;
  return splitHeroLines(pick);
}

/* ────────────────────────────────────────
   FadeUp — 스크롤 입장 애니메이션
──────────────────────────────────────── */
function FadeUp({
  children, delay = 0, style,
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref} style={style}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ────────────────────────────────────────
   제품 카드 (Supabase 데이터 기반)
──────────────────────────────────────── */
function ProductCard({
  product,
  index,
  imgBase,
  lang,
  fadeDelay = 0,
}: {
  product: HomeProduct;
  index: number;
  imgBase: string;
  lang: "ko" | "en";
  /** 스크롤 입장 순서용 (레이아웃과 무관) */
  fadeDelay?: number;
}) {
  const title  = lang === "ko" ? product.title_ko : product.title_en;
  const desc   = lang === "ko" ? (product.desc_ko ?? "") : (product.desc_en ?? "");
  const imgSrc = product.image_url || `${imgBase}/main/mainProducts_${index + 1}.png`;
  const to     = product.link_url ?? "/board/product";

  return (
    <FadeUp delay={fadeDelay}>
      <div
        className="overflow-hidden mb-6"
        style={{
          borderRadius: "1.6rem",
          aspectRatio: "16 / 10",
          backgroundColor: "#fff",
        }}
      >
        <img
          src={imgSrc}
          alt={title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            display: "block",
          }}
        />
      </div>
      <span
        className="block font-bold mb-3"
        style={{ fontSize: "clamp(1.8rem,2.5vw,2.6rem)", lineHeight: 1.3, color: "#fff" }}
      >
        {title}
      </span>
      <span
        className="block mb-8"
        style={{ fontSize: "1.5rem", lineHeight: 1.75, color: "rgba(255,255,255,0.6)" }}
      >
        {desc}
      </span>
      <Link to={to} className="btn-page-move white">
        <span>MORE VIEW</span>
        <i aria-hidden>
          <img src="/images/Union.png" alt="" />
        </i>
      </Link>
    </FadeUp>
  );
}

/* ════════════════════════════════════════
   히어로 아래 — 관리자 등록 이미지 3장 롤링
════════════════════════════════════════ */
function HomeRollingCarousel({ slides }: { slides: HomeRollingSlide[] }) {
  const [idx, setIdx] = useState(0);
  const [pointerDown, setPointerDown] = useState(false);
  const { isMobile } = useBreakpoint();
  const dragStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const slideKey = slides.map((s) => s.id).join("|");
  useEffect(() => {
    setIdx(0);
  }, [slideKey]);

  if (slides.length === 0) return null;

  const go = (dir: -1 | 1) => {
    setIdx((p) => {
      const n = slides.length;
      return (p + dir + n) % n;
    });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (slides.length <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setPointerDown(true);
  };

  const finishPointer = (e: PointerEvent<HTMLDivElement>, applySwipe: boolean) => {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== e.pointerId) return;
    dragStartRef.current = null;
    setPointerDown(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!applySwipe) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < ROLLING_SWIPE_MIN_PX) return;
    if (Math.abs(dx) < Math.abs(dy) * ROLLING_SWIPE_DOMINANCE) return;
    if (dx < 0) go(1);
    else go(-1);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    finishPointer(e, true);
  };

  const onPointerCancel = (e: PointerEvent<HTMLDivElement>) => {
    finishPointer(e, false);
  };

  const pad = isMobile ? "0 2rem" : "0 3rem";

  return (
    <section style={{ backgroundColor: "#fff", padding: isMobile ? "4rem 0 0" : "6rem 0 0" }}>
      <div
        style={{
          maxWidth: "150rem",
          margin: "0 auto",
          padding: pad,
          position: "relative",
        }}
      >
        {slides.length > 1 && !isMobile && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: "3rem",
              zIndex: 2,
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <button
              type="button"
              aria-label="이전"
              onClick={() => go(-1)}
              style={{
                width: "4.4rem",
                height: "4.4rem",
                border: "1px solid #ddd",
                borderRadius: "0.6rem",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "2rem",
                lineHeight: 1,
                color: "#333",
              }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음"
              onClick={() => go(1)}
              style={{
                width: "4.4rem",
                height: "4.4rem",
                border: "1px solid #ddd",
                borderRadius: "0.6rem",
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: "2rem",
                lineHeight: 1,
                color: "#333",
              }}
            >
              ›
            </button>
          </div>
        )}

        <div
          style={{
            borderRadius: "1.2rem",
            overflow: "hidden",
            backgroundColor: "#fff",
            touchAction: isMobile ? "pan-y" : undefined,
            cursor: slides.length > 1 ? (pointerDown ? "grabbing" : "grab") : undefined,
            userSelect: slides.length > 1 ? "none" : undefined,
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <motion.div
            style={{
              display: "flex",
              width: `${slides.length * 100}%`,
            }}
            animate={{
              x: `-${(100 / slides.length) * idx}%`,
            }}
            transition={{
              duration: 0.55,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {slides.map((s) => (
              <div
                key={s.id}
                style={{
                  flex: `0 0 ${100 / slides.length}%`,
                  width: `${100 / slides.length}%`,
                }}
              >
                <img
                  src={s.image_url}
                  alt=""
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════
   메인 HomePage
════════════════════════════════════════ */
export function HomePage() {
  const { lang, imgBase } = useLangStore();
  const { isMobile, isTablet } = useBreakpoint();

  /* ── Supabase 히어로 슬라이드 ── */
  const { data: slides = [] } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: visualService.getActiveSlides,
    staleTime: 1000 * 60 * 5,
  });

  const { data: rollingSlides = [] } = useQuery({
    queryKey: ["home-rolling-slides"],
    queryFn: homeRollingService.getActiveSlides,
    staleTime: 1000 * 60 * 5,
  });

  const [heroIndex, setHeroIndex] = useState(0);
  const [barProgress, setBarProgress] = useState(0);

  const heroSlides4 = useMemo(() => normalizeHeroSlidesToFour(slides), [slides]);

  /** 현재 슬롯 자동 전환 시각(performance.now 기준). 일시정지 분은 끝나며 밀어 넣음 */
  const slideDeadlineRef = useRef(performance.now() + HERO_AUTO_MS);
  /** 탭 비활성 등으로 멈춘 시각 — 다시 보이면 deadline만큼 연장 */
  const idleSinceRef = useRef<number | null>(null);
  const lastBarProgressRef = useRef(-1);

  const bumpSlideDeadline = () => {
    slideDeadlineRef.current = performance.now() + HERO_AUTO_MS;
    idleSinceRef.current = null;
    lastBarProgressRef.current = -1;
  };

  useEffect(() => {
    setHeroIndex(0);
    bumpSlideDeadline();
    setBarProgress(0);
  }, [heroSlides4]);

  /** 탭이 백그라운드일 때는 RAF가 멈출 수 있어, 숨김 구간만큼 전환 시각을 밀어 줌 */
  useEffect(() => {
    const onVisibility = () => {
      const now = performance.now();
      if (document.visibilityState === "hidden") {
        if (idleSinceRef.current === null) idleSinceRef.current = now;
      } else if (idleSinceRef.current !== null) {
        slideDeadlineRef.current += now - idleSinceRef.current;
        idleSinceRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (document.visibilityState === "hidden") {
        raf = requestAnimationFrame(tick);
        return;
      }

      const now = performance.now();
      const remain = slideDeadlineRef.current - now;
      if (remain <= 0) {
        setHeroIndex((i) => (i + 1) % HERO_TIMELINE_SLOTS);
        slideDeadlineRef.current = now + HERO_AUTO_MS;
        lastBarProgressRef.current = -1;
        setBarProgress(0);
      } else {
        const p = 1 - remain / HERO_AUTO_MS;
        if (
          lastBarProgressRef.current < 0 ||
          Math.abs(p - lastBarProgressRef.current) >= HERO_PROGRESS_EPS ||
          p >= 1 - HERO_PROGRESS_EPS
        ) {
          lastBarProgressRef.current = p;
          setBarProgress(p);
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const goHeroSlide = (idx: number) => {
    setHeroIndex(idx);
    bumpSlideDeadline();
    setBarProgress(0);
  };

  const activeHeroSlide = heroSlides4[heroIndex];
  const heroBgImage = activeHeroSlide?.image_url?.trim() ?? "";

  const reduceMotion = useReducedMotion();

  const heroSlot = t.home.heroTimeline[heroIndex];
  const mainFromDb = heroMainLinesFromSlide(activeHeroSlide, lang);
  const subFromDb = heroSubLinesFromSlide(activeHeroSlide, lang);
  const heroLine1 = mainFromDb?.[0] ?? tr(heroSlot.line1, lang);
  const heroLine2 = mainFromDb?.[1] ?? tr(heroSlot.line2, lang);
  const heroSub1 = subFromDb?.[0] ?? tr(heroSlot.subLine1, lang);
  const heroSub2 = subFromDb?.[1] ?? tr(heroSlot.subLine2, lang);

  /* ── Supabase 홈 제품 목록 ── */
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["home-products"],
    queryFn: productService.getActiveProducts,
    staleTime: 1000 * 60 * 5,
  });

  /* Supabase 데이터 없으면 translations 기본값 사용 */
  const fallbackProducts: HomeProduct[] = t.home.products.map((p, i) => ({
    id: `fallback-${i}`,
    title_ko: p.title.ko,
    title_en: p.title.en,
    desc_ko: p.desc.ko,
    desc_en: p.desc.en,
    image_url: null,
    link_url: [
      "/board/product/browse?cat=needle",
      "/board/product/browse?cat=cannula",
      "/board/product/browse?cat=cannula",
      "/board/product/browse?cat=cannula",
      "/board/product/browse?cat=anesthesia",
      "/board/product/browse?cat=anesthesia",
    ][i] ?? "/board/product",
    sort_order: i,
    is_active: true,
    created_at: "",
  }));

  const products = dbProducts.length > 0 ? dbProducts : fallbackProducts;

  return (
    <div>

      {/* ══════════════════════════════════
          1. HERO
      ══════════════════════════════════ */}
      <section
        className="hero-viewport-fill relative flex flex-col overflow-hidden"
        style={{
          backgroundColor: "#0c0c0e",
        }}
      >
        {/* 슬라이드 배경: 크로스페이드 + 슬롯 동안 아주 느린 켄번즈(줌) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {heroBgImage ? (
            reduceMotion ? (
              <motion.div
                key={`${heroIndex}-${heroBgImage}`}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  backgroundImage: `url(${heroBgImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={`${heroIndex}-${heroBgImage}`}
                  className="absolute inset-0 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: HERO_BG_FADE_SEC, ease: HERO_MOTION_EASE }}
                >
                  <motion.div
                    className="absolute"
                    style={{
                      top: "-8%",
                      left: "-8%",
                      width: "116%",
                      height: "116%",
                      backgroundImage: `url(${heroBgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      willChange: "transform",
                    }}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: [1.1, 1, 1.065] }}
                    transition={{
                      duration: HERO_AUTO_MS / 1000,
                      times: [0, 0.14, 1],
                      ease: ["easeOut", "linear", "linear"],
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            )
          ) : null}
        </div>

        {/* 다크 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background: heroBgImage
              ? "linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.48) 55%, rgba(0,0,0,0.14) 100%)"
              : `radial-gradient(ellipse 70% 60% at 100% 50%, rgba(255,255,255,0.04) 0%, transparent 60%),
                 radial-gradient(ellipse 50% 70% at 0% 100%, rgba(0,0,0,0.45) 0%, transparent 55%),
                 radial-gradient(ellipse 40% 40% at 80% 10%, rgba(0,0,0,0.25) 0%, transparent 50%)`,
          }}
        />

        {/* 워터마크 (이미지 없을 때만) */}
        {!heroBgImage && (
          <img
            src={`${imgBase}/main/mark_img.png`}
            alt="" aria-hidden
            className="absolute pointer-events-none select-none"
            style={{
              zIndex: 0,
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              height: "90%",
              width: "auto",
              opacity: 0.06,
            }}
          />
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            position: "relative",
            zIndex: 1,
            minHeight: 0,
          }}
        >
          {/* 헤드라인 · 서브 · CTA — 헤더~타임라인 사이 세로 중앙 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              position: "relative",
              minHeight: 0,
              paddingTop: isMobile ? HERO_PAD_TOP_MOBILE : HERO_PAD_TOP_PC,
              paddingBottom: isMobile ? "1.2rem" : "1.6rem",
            }}
          >
            <div
              className="section-inner w-full"
              style={{
                paddingLeft: isMobile ? "2rem" : isTablet ? "3rem" : "1.5rem",
                paddingRight: isMobile ? "2rem" : isTablet ? "3rem" : "1.5rem",
                paddingTop: 0,
                paddingBottom: 0,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroIndex}
                  initial={{ opacity: 0, y: 36 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -28 }}
                  transition={{ duration: 0.5, ease: HERO_MOTION_EASE }}
                >
                  <h1
                    style={{
                      fontSize: isMobile
                        ? "3.2rem"
                        : isTablet
                        ? "4.2rem"
                        : "clamp(3.6rem, 4.2vw, 5.4rem)",
                      fontWeight: 700,
                      lineHeight: 1.12,
                      letterSpacing: "-0.035em",
                      color: "#fff",
                      whiteSpace: "pre-line",
                      marginBottom:
                        heroSub1.trim() || heroSub2.trim() ? "2rem" : "3.2rem",
                      /* section-inner 전폭 사용 — 좁은 maxWidth 제거로 타이틀이 2줄 전후로 정리되게 */
                      width: "100%",
                      maxWidth: "100%",
                      textWrap: "balance",
                    }}
                  >
                    {heroLine1}
                    {heroLine2.trim() ? (
                      <>
                        <br />
                        {heroLine2}
                      </>
                    ) : null}
                  </h1>
                  {heroSub1.trim() || heroSub2.trim() ? (
                    <p
                      style={{
                        fontSize: isMobile
                          ? "1.65rem"
                          : isTablet
                          ? "1.75rem"
                          : "clamp(1.65rem, 1.05vw, 1.85rem)",
                        fontWeight: 400,
                        color: "#fff",
                        lineHeight: 1.65,
                        width: "100%",
                        maxWidth: "100%",
                        whiteSpace: "pre-line",
                        marginBottom: "3.6rem",
                        letterSpacing: "-0.01em",
                        textWrap: "balance",
                      }}
                    >
                      {heroSub1}
                      {heroSub2.trim() ? (
                        <>
                          <br />
                          {heroSub2}
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <motion.div
                key={`hero-cta-${heroIndex}`}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.14, ease: HERO_MOTION_EASE }}
                style={{ display: "flex", flexWrap: "wrap", gap: "1.6rem" }}
              >
                <Link
                  to="/board/product"
                  className="btn btn-accent btn-lg inline-flex items-center gap-2"
                >
                  {tr(t.home.heroBtn1, lang)}
                  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                    <path
                      d="M11 1l6 6-6 6M17 7H1"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
                <Link
                  to="/contact"
                  className="btn btn-lg inline-flex items-center gap-2"
                  style={{
                    backgroundColor: "transparent",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}
                >
                  {tr(t.home.heroBtn2, lang)}
                </Link>
              </motion.div>
            </div>
          </div>

          {/* 하단 타임라인: 4구간 진행바 → 채워지면 다음 이미지 */}
          <div
            className="section-inner w-full"
            style={{
              flexShrink: 0,
              alignSelf: "stretch",
              margin: "0 auto",
              boxSizing: "border-box",
              padding: isMobile
                ? "0 2rem 2.4rem"
                : isTablet
                ? "0 3rem 3rem"
                : "0 1.5rem 3.2rem",
              paddingTop: isMobile ? "1.6rem" : "2rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: isMobile ? "0.35rem" : "0.75rem",
                width: "100%",
                alignItems: "flex-start",
              }}
            >
              {Array.from({ length: HERO_TIMELINE_SLOTS }, (_, i) => {
                const slot = t.home.heroTimeline[i];
                const slideAtI = heroSlides4[i];
                const tlMain = heroMainLinesFromSlide(slideAtI, lang);
                const tlLine1 = tlMain?.[0] ?? tr(slot.line1, lang);
                const tlLine2 = tlMain?.[1] ?? tr(slot.line2, lang);
                const active = i === heroIndex;
                const fillW = heroSegmentFillWidth(i, heroIndex, barProgress);
                const done = i < heroIndex;
                const barH = active ? 4 : done ? 3 : 2;
                const titleForA11y = `${tlLine1}${tlLine2 ? ` ${tlLine2}` : ""}`.trim();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goHeroSlide(i)}
                    aria-label={
                      isMobile
                        ? `${String(i + 1).padStart(2, "0")}. ${titleForA11y || `슬라이드 ${i + 1}`}`
                        : `히어로 ${i + 1}번`
                    }
                    aria-current={active ? "step" : undefined}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem 0.15rem 0",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: "6px",
                        marginBottom: "1.05rem",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: "2px",
                          backgroundColor: "rgba(255,255,255,0.22)",
                          borderRadius: "1px",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          bottom: 0,
                          width: fillW,
                          height: `${barH}px`,
                          backgroundColor: "#fff",
                          borderRadius: "1px",
                          boxShadow:
                            active && barProgress > 0.02
                              ? "0 0 14px rgba(255,255,255,0.4)"
                              : "none",
                          transition: "width 0.1s linear, height 0.2s ease-out, box-shadow 0.25s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: isMobile ? "1.05rem" : "clamp(1.1rem, 1.05vw, 1.35rem)",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: active ? "#fff" : "rgba(255,255,255,0.4)",
                        letterSpacing: "0.1em",
                        marginBottom: isMobile ? 0 : "0.5rem",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    {!isMobile ? (
                      <p
                        style={{
                          fontSize: "clamp(0.98rem, 0.92vw, 1.15rem)",
                          fontWeight: 500,
                          lineHeight: 1.48,
                          color: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.38)",
                          wordBreak: "keep-all",
                          margin: 0,
                        }}
                      >
                        {tlLine1}
                        {tlLine2 ? (
                          <>
                            <br />
                            {tlLine2}
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════
          2. 히어로 아래 롤링 이미지 (관리자 등록 최대 3장)
      ══════════════════════════════════ */}
      <HomeRollingCarousel slides={rollingSlides} />

      {/* ══════════════════════════════════
          3. PRODUCTS
      ══════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "#1A0855" }}
      >
        <img
          src={`${imgBase}/main/main_deco.png`}
          alt="" aria-hidden
          className="absolute bottom-0 right-0 pointer-events-none select-none"
        />
        <div
          className="section-inner relative"
          style={{
            paddingTop: "100px",
            paddingBottom: isMobile ? "7rem" : "10rem",
            paddingLeft: isMobile ? "2rem" : "1.5rem",
            paddingRight: isMobile ? "2rem" : "1.5rem",
          }}
        >
          {isMobile ? (
            <>
              <FadeUp style={{ marginBottom: "3.2rem" }}>
                <p
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: ACCENT,
                    marginBottom: "2rem",
                  }}
                >
                  {tr(t.home.productsLabel, lang)}
                </p>
                <h2
                  className="font-bold text-white"
                  style={{
                    fontSize: "2.8rem",
                    lineHeight: 1.18,
                    letterSpacing: "-0.04em",
                    whiteSpace: "pre-line",
                  }}
                >
                  {tr(t.home.productsTitle, lang)}
                </h2>
              </FadeUp>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5rem",
                }}
              >
                {products.map((product, i) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={i}
                    imgBase={imgBase}
                    lang={lang}
                    fadeDelay={0.06 * i}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                columnGap: isTablet ? "4rem" : "clamp(4rem, 6vw, 8rem)",
                alignItems: "start",
              }}
            >
              {/* 왼쪽: PRODUCTS 카피 + 홀수 번째 카드(1,3,5…) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(4.5rem, 6vw, 7rem)",
                }}
              >
                <FadeUp>
                  <p
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: ACCENT,
                      marginBottom: "2rem",
                    }}
                  >
                    {tr(t.home.productsLabel, lang)}
                  </p>
                  <h2
                    className="font-bold text-white m-0"
                    style={{
                      fontSize: "clamp(2.8rem, 4.5vw, 4.8rem)",
                      lineHeight: 1.18,
                      letterSpacing: "-0.04em",
                      whiteSpace: "pre-line",
                      maxWidth: "42rem",
                    }}
                  >
                    {tr(t.home.productsTitle, lang)}
                  </h2>
                </FadeUp>
                {products
                  .map((product, index) => ({ product, index }))
                  .filter(({ index }) => index % 2 === 1)
                  .map(({ product, index }, j) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      imgBase={imgBase}
                      lang={lang}
                      fadeDelay={0.05 * j}
                    />
                  ))}
              </div>
              {/* 오른쪽: 짝수 번째 카드(0,2,4…) — 첫 카드가 왼쪽 헤드라인과 같은 높이에서 시작 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(4.5rem, 6vw, 7rem)",
                }}
              >
                {products
                  .map((product, index) => ({ product, index }))
                  .filter(({ index }) => index % 2 === 0)
                  .map(({ product, index }, j) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      imgBase={imgBase}
                      lang={lang}
                      fadeDelay={0.05 * j}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════
          7. CONTACT CTA
      ══════════════════════════════════ */}
      <section
        style={{
          background: `linear-gradient(135deg, #212020 0%, #1a1a1a 50%, ${PRIMARY} 100%)`,
          padding: isMobile ? "6rem 2rem" : "10rem 0",
        }}
      >
        <div className="section-inner text-center">
          <FadeUp>
            <p
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: ACCENT,
                marginBottom: "1.6rem",
              }}
            >
              Contact Us
            </p>
            <h2
              className="font-bold text-white mb-3"
              style={{
                fontSize: isMobile ? "2.8rem" : "clamp(2.4rem,3.5vw,4rem)",
                letterSpacing: "-0.04em",
              }}
            >
              {tr(t.home.contactTitle, lang)}
            </h2>
            <p
              className="mb-10"
              style={{ fontSize: "1.6rem", color: "rgba(255,255,255,0.55)" }}
            >
              {tr(t.home.contactDesc, lang)}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.6rem",
              }}
            >
              <Link to="/contact" className="btn btn-accent btn-lg">
                {tr(t.home.contactBtn1, lang)}
              </Link>
              <a
                href="tel:031-989-8311"
                className="btn btn-lg"
                style={{
                  backgroundColor: "transparent",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                031-989-8311
              </a>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
