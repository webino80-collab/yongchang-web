/**
 * Cloudflare Pages Functions — 모든 요청 전에 실행됩니다.
 *
 * - Cloudflare가 넣어 주는 `cf-ipcountry`가 **KR**이면 국문 사이트(통과).
 * - **확실한 해외** 국가 코드(예: US)면 브라우저 언어와 무관하게 `/en`으로 보냄
 *   (VPN은 IP만 바꾸고 Accept-Language는 그대로인 경우가 많음).
 * - 국가를 알 수 없을 때(로컬, XX, T1 등)만 `Accept-Language`에 `ko`가 없으면 `/en`.
 *
 * @see https://developers.cloudflare.com/pages/functions/middleware/
 * @see https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-ipcountry
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

/** cf-ipcountry: 한국이면 국문 사이트 유지 */
function isKoreaIp(country: string | undefined): boolean {
  return country === "KR";
}

/**
 * 국가를 특정할 수 없거나 Tor 등 — Accept-Language 폴백을 쓸 때만 true.
 * (이때는 기존처럼 ko 선호 여부로 판단)
 */
function shouldUseLanguageFallback(country: string | undefined): boolean {
  if (country === undefined || country === "") return true;
  if (country === "XX" || country === "T1") return true;
  return false;
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

  const country = request.headers.get("cf-ipcountry")?.toUpperCase();

  if (isKoreaIp(country)) {
    return next();
  }

  if (shouldUseLanguageFallback(country)) {
    const acceptLanguage = request.headers.get("accept-language");
    if (hasKoreanInAcceptLanguage(acceptLanguage)) {
      return next();
    }
  }

  url.pathname = "/en";
  return Response.redirect(url.toString(), 302);
}
