import { useState, useEffect } from "react";

const BP = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

export function useBreakpoint() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    isSm:  w >= BP.sm,
    isMd:  w >= BP.md,
    isLg:  w >= BP.lg,
    isXl:  w >= BP.xl,
    /** 모바일 (< 768px) */
    isMobile:  w < BP.md,
    /** 태블릿 (768 ~ 1023px) */
    isTablet:  w >= BP.md && w < BP.lg,
    /** 데스크탑 (≥ 1024px) */
    isDesktop: w >= BP.lg,
    width: w,
  };
}
