/**
 * Cloudflare transactional-mail Worker 호출용 환경 변수.
 * Supabase Edge Secrets: MAIL_WORKER_URL, MAIL_WORKER_KEY (Bearer 토큰).
 * 기존 프로젝트 호환: MAIL_WORKER_SECRET 이 있으면 KEY 대신 사용.
 *
 * MAIL_WORKER_URL: **메일 전용 Worker** 의 `https://….workers.dev` 주소.
 * Cloudflare Pages(`*.pages.dev`)는 메일 API가 아니므로 넣으면 안 됩니다.
 * `https://` 생략 시 자동으로 붙임 (Deno fetch Invalid URL 방지).
 */
export function getMailWorkerUrl(): string | undefined {
  let u = Deno.env.get("MAIL_WORKER_URL")?.trim();
  if (!u) return undefined;
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u.replace(/\/$/, "");
}

export function getMailWorkerBearerToken(): string | undefined {
  const key = Deno.env.get("MAIL_WORKER_KEY")?.trim();
  if (key) return key;
  return Deno.env.get("MAIL_WORKER_SECRET")?.trim() || undefined;
}
