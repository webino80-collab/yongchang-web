import type { Profile } from "@/types";

/** 고객사 등 콘텐츠만 다루는 제한 관리자 (회원·게시판 등 제외) */
export const LEVEL5_CONTENT_ADMIN_LEVEL = 5;

/** 레벨 5 관리자에게 허용되는 관리자 경로 (순서 = 사이드바 정렬 기준) */
export const LEVEL5_ADMIN_NAV_PATHS = [
  "/admin/visual",
  "/admin/page-banners",
  "/admin/about-timeline",
  "/admin/product-landing",
  "/admin/products",
  "/admin/product-categories",
  "/admin/certificates",
  "/admin/brochures",
] as const;

const LEVEL5_PATH_SET = new Set<string>(LEVEL5_ADMIN_NAV_PATHS);

export function isLevel5ContentAdmin(profile: Profile | null | undefined): boolean {
  return profile?.is_admin === true && profile.level === LEVEL5_CONTENT_ADMIN_LEVEL;
}

export function normalizeAdminPath(pathname: string): string {
  if (!pathname.startsWith("/admin")) return pathname;
  const t = pathname.replace(/\/+$/, "");
  return t === "" ? "/admin" : t;
}

/** 레벨 5 관리자가 이 URL로 본문을 볼 수 있는지 (`/admin` 루트는 false → 기본 리다이렉트) */
export function isLevel5AdminPathAllowed(pathname: string): boolean {
  return LEVEL5_PATH_SET.has(normalizeAdminPath(pathname));
}

export const LEVEL5_ADMIN_DEFAULT_PATH = "/admin/visual";
