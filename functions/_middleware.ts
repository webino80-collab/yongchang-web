/**
 * Cloudflare Pages Functions — 모든 요청 전에 실행됩니다.
 * 정적 배포(Vite) + Pages에서 accept-language 기반 /en 리다이렉트에 사용합니다.
 *
 * @see https://developers.cloudflare.com/pages/functions/middleware/
 */

type PagesContext = {
  request: Request;
  next: () => Promise<Response>;
};

/** Accept-Language 값에 한국어(ko) 선호가 있는지 확인 */
function hasKoreanInAcceptLanguage(acceptLanguage: string | null): boolean {
  if (!acceptLanguage) return false;
  for (const segment of acceptLanguage.split(",")) {
    const tag = segment.split(";")[0]?.trim().toLowerCase();
    if (!tag) continue;
    if (tag === "ko" || tag.startsWith("ko-")) return true;
  }
  return false;
}

const STATIC_EXT = new Set([
  "ico",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
  "avif",
  "bmp",
  "css",
  "js",
  "mjs",
  "map",
  "json",
  "txt",
  "xml",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
]);

function isStaticOrAssetPath(pathname: string): boolean {
  if (pathname === "/favicon.ico") return true;

  const last = pathname.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = last.slice(dot + 1).toLowerCase();
  return STATIC_EXT.has(ext);
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, next } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  if (isStaticOrAssetPath(pathname)) {
    return next();
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return next();
  }

  const acceptLanguage = request.headers.get("accept-language");
  if (hasKoreanInAcceptLanguage(acceptLanguage)) {
    return next();
  }

  url.pathname = "/en";
  return Response.redirect(url.toString(), 302);
}
