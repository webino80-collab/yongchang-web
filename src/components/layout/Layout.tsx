import { useState, useEffect, useRef, useMemo } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLangStore } from "@/store/useLangStore";
import { t, tr } from "@/i18n/translations";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { clsx } from "clsx";
import { productCategoryService } from "@/lib/productCategoryService";

/* 헤더 높이 — padding 4.6rem×2 + logo 2.8rem = 12rem = 120px (10px base) */
const HEADER_H_PC     = 120;
const HEADER_H_MOBILE = 60;

const LANGS = ["ko", "en"] as const;

export function Layout() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const { lang, imgBase, setLang } = useLangStore();
  const { isMobile } = useBreakpoint();

  const [scrolled,       setScrolled]       = useState(false);
  const [hidden,         setHidden]         = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [langOpen,       setLangOpen]       = useState(false);
  const prevScrollY = useRef(0);

  const { data: productNavCategories = [] } = useQuery({
    queryKey: ["product-categories-public"],
    queryFn: () => productCategoryService.getActive(),
  });

  const productNavChildren = useMemo(
    () =>
      productNavCategories.map((c) => ({
        label: lang === "ko" ? c.label_ko : c.label_en,
        to: `/board/product/browse?cat=${encodeURIComponent(c.slug)}`,
      })),
    [productNavCategories, lang]
  );

  /* 스크롤 방향 감지 */
  useEffect(() => {
    const onScroll = () => {
      const curr = window.scrollY;
      setScrolled(curr > 40);
      setHidden(curr > prevScrollY.current && curr > HEADER_H_PC);
      prevScrollY.current = curr;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* 경로 변경 시 메뉴 닫기 */
  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const isHome = location.pathname === "/";
  /** 홈 최상단: 히어로 풀스크린 위 투명 헤더 + 흰색 GNB */
  const onHero = isHome && !scrolled;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-clip">

      {/* 헤더 높이만큼 placeholder — 홈은 히어로가 헤더 아래까지 올라가므로 생략 */}
      {!isHome && (
        <>
          <div style={{ height: HEADER_H_PC }} className="hidden md:block shrink-0" aria-hidden />
          <div style={{ height: HEADER_H_MOBILE }} className="md:hidden shrink-0" aria-hidden />
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          ② motion.header — Framer Motion 슬라이드 (CSS transform 제거)
      ════════════════════════════════════════════════════════ */}
      <motion.header
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.4, ease: [0.2, 0.4, 0.9, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1002,
          /* fixed인데 flex 자식이면 WebKit에서 헤더·드로어 높이만큼 문서가 또 늘어날 수 있음 — 레이아웃 높이 0 + 내용은 overflow로 표시 */
          flex: "none",
          alignSelf: "stretch",
          width: "100%",
          height: 0,
          minHeight: 0,
          overflow: "visible",
          backgroundColor: onHero ? "transparent" : "#fff",
          boxShadow: onHero ? "none" : scrolled ? "0 2px 16px rgba(0,0,129,0.08)" : "none",
          borderBottom: onHero ? "none" : scrolled ? "none" : "1px solid #e5e5e5",
        }}
      >

        {/* ══════════════════════════════
            PC 헤더
            [로고 18.1rem] [nav margin-left:10vw] [util: absolute top:4.8rem right:8rem]
        ══════════════════════════════ */}
        <div
          className="hidden md:flex"
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            padding: "4.6rem 8rem",
            position: "relative",
            alignItems: "center",
          }}
        >
          {/* 로고 — ① imgBase 사용 */}
          <Link
            to="/"
            style={{ flexShrink: 0, display: "flex", alignItems: "center", width: "18.1rem" }}
          >
            <img
              src={onHero ? `${imgBase}/main/logo_white.svg` : `${imgBase}/main/logo.svg`}
              alt="주식회사 용창"
              style={{ height: "2.8rem", width: "auto" }}
            />
          </Link>

          {/* 네비게이션 */}
          <nav style={{ marginLeft: "clamp(2rem, 6vw, 8rem)", display: "flex", alignItems: "center", gap: "clamp(2.4rem, 3.5vw, 6.4rem)", flexShrink: 1, flexWrap: "nowrap" }}>
            {[
              { label: tr(t.nav.company, lang),  to: "/about" },
              { label: tr(t.nav.product, lang),  to: "/board/product", children: productNavChildren },
              { label: tr(t.nav.cert, lang),     to: "/board/certificate" },
              { label: tr(t.nav.brochure, lang), to: "/board/brochure" },
              { label: tr(t.nav.contact, lang),  to: "/contact" },
            ].map((item) => (
              <div
                key={item.to}
                style={{ position: "relative" }}
                onMouseEnter={() => setActiveDropdown(item.to)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <NavLink
                  to={item.to}
                  style={({ isActive }) => ({
                    fontSize: "2rem",
                    fontWeight: isActive ? 700 : 500,
                    color: onHero
                      ? isActive
                        ? "#fff"
                        : "rgba(255,255,255,0.88)"
                      : "#222",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.02em",
                    transition: "color 0.2s",
                  })}
                  className={onHero ? "hover:!text-white" : "hover:text-[#000081]"}
                >
                  {item.label}
                  {item.children && (
                    <svg
                      style={{
                        width: 12, height: 12, opacity: 0.4,
                        transform: activeDropdown === item.to ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                      viewBox="0 0 20 20" fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </NavLink>

                {/* ③ AnimatePresence 드롭다운 */}
                <AnimatePresence>
                  {item.children && activeDropdown === item.to && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        position: "absolute",
                        top: "100%", left: 0,
                        minWidth: 220,
                        paddingTop: "3.4rem",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e5e5",
                          borderRadius: "1rem",
                          boxShadow: "1px 1px 10px rgba(34,34,34,0.24)",
                          padding: "2.2rem",
                        }}
                      >
                        {item.children.map((child, idx) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            style={{
                              display: "block",
                              fontSize: "1.8rem",
                              fontWeight: 500,
                              color: "#222",
                              marginTop: idx > 0 ? "2.4rem" : 0,
                              letterSpacing: "-0.01em",
                              transition: "color 0.2s",
                            }}
                            className="hover:text-[#000081]"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* ④ 헤더 유틸 — marginLeft:auto 로 우측 정렬 (겹침 방지) */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              flexShrink: 0,
            }}
          >
            {/* 관리자 링크 (관리자 계정만 노출) */}
            {user && profile?.is_admin && (
              <Link
                to="/admin"
                style={{
                  color: onHero ? "rgba(200,245,255,0.95)" : "#00b4d6",
                  fontWeight: 500,
                  fontSize: "1.4rem",
                  transition: "opacity 0.2s",
                }}
                className="hover:opacity-70"
              >
                관리자
              </Link>
            )}

            {/* 언어 전환 버튼 */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                onBlur={() => setTimeout(() => setLangOpen(false), 150)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.6rem",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0.6rem 0.8rem", borderRadius: "0.6rem",
                  fontSize: "1.4rem", fontWeight: 500,
                  color: onHero ? "#fff" : "#222",
                  transition: "background 0.2s",
                }}
                className={onHero ? "hover:bg-white/10" : "hover:bg-[#f3f7fa]"}
                aria-label="언어 변경"
              >
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 27C21.1797 27 27 21.1797 27 14C27 6.8203 21.1797 1 14 1C6.8203 1 1 6.8203 1 14C1 21.1797 6.8203 27 14 27Z" stroke={onHero ? "#fff" : "#222"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.29688 14H26.9969" stroke={onHero ? "#fff" : "#222"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 1.26172C17.2167 4.54432 19.2 9.04009 19.2 13.9991C19.2 18.9581 17.2167 23.4539 14 26.7364" stroke={onHero ? "#fff" : "#222"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.0047 1.26172C10.788 4.54432 8.80469 9.04009 8.80469 13.9991C8.80469 18.9581 10.788 23.4539 14.0047 26.7364" stroke={onHero ? "#fff" : "#222"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{lang.toUpperCase()}</span>
                <svg
                  style={{
                    width: 10, height: 10, opacity: 0.5,
                    transform: langOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* 언어 드롭다운 */}
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)", right: 0,
                      backgroundColor: "#fff",
                      border: "1px solid #e5e5e5",
                      borderRadius: "1rem",
                      boxShadow: "1px 1px 10px rgba(34,34,34,0.24)",
                      padding: "1rem 0",
                      minWidth: 100,
                      zIndex: 10,
                    }}
                  >
                    {LANGS.map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLang(l); setLangOpen(false); }}
                        style={{
                          display: "block", width: "100%",
                          padding: "0.8rem 1.8rem",
                          textAlign: "left", background: "none", border: "none",
                          cursor: "pointer", fontSize: "1.6rem",
                          fontWeight: lang === l ? 700 : 400,
                          color: lang === l ? "#000081" : "#222",
                          transition: "color 0.2s, background 0.2s",
                        }}
                        className="hover:bg-[#f3f7fa]"
                      >
                        {l === "ko" ? "한국어" : "English"}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════
            모바일 헤더
        ══════════════════════════════ */}
        <div
          className="md:hidden flex items-center justify-between px-5"
          style={{ height: HEADER_H_MOBILE }}
        >
          <Link to="/">
            <img
              src={onHero ? `${imgBase}/main/logo_white.svg` : `${imgBase}/main/logo.svg`}
              alt="주식회사 용창"
              style={{ height: "2.2rem", width: "auto" }}
            />
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "ko" ? "en" : "ko")}
              style={{
                fontSize: "1.2rem", fontWeight: 600,
                color: onHero ? "#fff" : "#555",
                background: "none",
                border: onHero ? "1px solid rgba(255,255,255,0.45)" : "1px solid #e5e5e5",
                borderRadius: "0.4rem", padding: "0.3rem 0.6rem", cursor: "pointer",
              }}
            >
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex flex-col gap-1.5 p-2"
              aria-label="메뉴 열기"
            >
              <span
                className={clsx(
                  "block w-6 h-0.5 transition-all duration-300",
                  onHero ? "bg-white" : "bg-[#222]",
                  mobileOpen ? "rotate-45 translate-y-2" : ""
                )}
              />
              <span
                className={clsx(
                  "block w-6 h-0.5 transition-all duration-300",
                  onHero ? "bg-white" : "bg-[#222]",
                  mobileOpen ? "opacity-0" : ""
                )}
              />
              <span
                className={clsx(
                  "block w-6 h-0.5 transition-all duration-300",
                  onHero ? "bg-white" : "bg-[#222]",
                  mobileOpen ? "-rotate-45 -translate-y-2" : ""
                )}
              />
            </button>
          </div>
        </div>

        {/* 모바일 드로어 — AnimatePresence 슬라이드 */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden bg-white border-t"
              style={{ borderColor: "#e5e5e5" }}
            >
              <div className="px-5 py-3 space-y-0.5">
                {[
                  { label: tr(t.nav.company, lang),  to: "/about" },
                  { label: tr(t.nav.product, lang),  to: "/board/product", children: productNavChildren },
                  { label: tr(t.nav.cert, lang),     to: "/board/certificate" },
                  { label: tr(t.nav.brochure, lang), to: "/board/brochure" },
                  { label: tr(t.nav.contact, lang),  to: "/contact" },
                ].map((item) => (
                  <div key={item.to}>
                    <Link
                      to={item.to}
                      className="block py-3 px-2 font-medium text-[#333] hover:text-[#000081] transition-colors"
                      style={{ fontSize: "1.6rem", letterSpacing: "-0.02em" }}
                    >
                      {item.label}
                    </Link>
                    {item.children && (
                      <div className="ml-4 space-y-0.5 pb-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="block py-2 px-2 text-[#777] hover:text-[#000081] transition-colors"
                            style={{ fontSize: "1.4rem" }}
                          >
                            └ {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {user && profile?.is_admin && (
                  <div className="border-t pt-3 mt-2" style={{ borderColor: "#e5e5e5" }}>
                    <Link to="/admin" className="btn btn-ghost btn-sm">관리자</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main className={clsx("w-full min-w-0 shrink-0", isHome && "p-0 m-0")}>
        <Outlet />
      </main>

      {/* ⑤ 푸터 — mt-auto: 짧은 페이지에서 본문 아래 빈 flex 구간 없이 하단 정렬 */}
      <footer
        className="mt-auto w-full shrink-0"
        style={{ backgroundColor: "#222", position: "relative", zIndex: 1000 }}
      >
        <div
          style={{
            maxWidth: 1500,
            margin: "0 auto",
            padding: isMobile ? "4rem 2rem" : "5rem 3rem",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? "3.2rem" : undefined,
          }}
        >
          {/* 로고 */}
          <div style={{ flexShrink: 0, marginRight: isMobile ? 0 : "15rem" }}>
            <img
              src={`${imgBase}/common/footer_logo.svg`}
              alt="주식회사 용창"
              style={{ height: "2.4rem", width: "auto" }}
            />
          </div>

          {/* 회사 정보 */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: isMobile ? "2.4rem" : "7rem",
              color: "#fff",
              flex: 1,
            }}
          >
            <div>
              <strong style={{ display: "block", fontWeight: 700, fontSize: isMobile ? "2rem" : "3rem", marginBottom: "1.6rem", color: "#fff" }}>
                {lang === "ko" ? "주식회사 용창" : "Yongchang Co., Ltd."}
              </strong>
              <p style={{ fontSize: "1.4rem", color: "#aaa", lineHeight: 1.8 }}>
                {lang === "ko"
                  ? <>경기도 김포시 양촌읍 황금로 292번길 16<br />TEL 031-989-8311 &nbsp; FAX 031-985-8312<br />EMAIL ycpbm@hanmail.net</>
                  : <>292-16, Hwanggeum-ro, Yangchon-eup, Gimpo-si, Gyeonggi-do<br />TEL +82-31-989-8311 &nbsp; FAX +82-31-985-8312<br />EMAIL ycpbm@hanmail.net</>
                }
              </p>
            </div>

            <div>
              <strong style={{ display: "block", fontWeight: 700, fontSize: "1.6rem", marginBottom: "1.6rem", color: "#fff" }}>
                {tr(t.footer.hours, lang)}
              </strong>
              <p style={{ fontSize: "1.4rem", color: "#aaa", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {tr(t.footer.hoursDetail, lang)}
              </p>
            </div>
          </div>
        </div>

        {/* 카피라이트 */}
        <div
          style={{
            borderTop: "1px solid #383838",
            padding: isMobile ? "2rem 2rem" : "2rem 2.4rem",
            textAlign: "center",
            fontSize: "1.4rem",
            color: "#666",
            maxWidth: 1500,
            margin: "0 auto",
          }}
        >
          © {new Date().getFullYear()} {tr(t.footer.copy, lang)}
        </div>
      </footer>
    </div>
  );
}
