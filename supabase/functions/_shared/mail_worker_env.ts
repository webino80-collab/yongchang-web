/**
 * Cloudflare transactional-mail Worker 호출용 환경 변수.
 * Supabase Edge Secrets: MAIL_WORKER_URL, MAIL_WORKER_KEY (Bearer 토큰).
 * 기존 프로젝트 호환: MAIL_WORKER_SECRET 이 있으면 KEY 대신 사용.
 */
export function getMailWorkerUrl(): string | undefined {
  const u = Deno.env.get("MAIL_WORKER_URL")?.trim();
  if (!u) return undefined;
  return u.replace(/\/$/, "");
}

export function getMailWorkerBearerToken(): string | undefined {
  const key = Deno.env.get("MAIL_WORKER_KEY")?.trim();
  if (key) return key;
  return Deno.env.get("MAIL_WORKER_SECRET")?.trim() || undefined;
}
