/**
 * Supabase Edge Functions 등에서 호출하는 트랜잭션 메일 발송 API.
 * Cloudflare Email Routing send_email 바인딩 + EmailMessage (cloudflare:email).
 */
/// <reference types="@cloudflare/workers-types" />
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext/browser";

const MAX = { subject: 300, html: 400_000 } as const;

interface Env {
  MAIL: SendEmail;
  /** Supabase 등에서 MAIL_WORKER_KEY 로 통일한 경우 */
  MAIL_WORKER_KEY?: string;
  /** 기존 이름 (wrangler secret put MAIL_WORKER_SECRET) */
  MAIL_WORKER_SECRET?: string;
  FROM_ADDR: string;
  FROM_NAME: string;
}

function workerBearerSecret(env: Env): string | undefined {
  const k = env.MAIL_WORKER_KEY?.trim();
  if (k) return k;
  const s = env.MAIL_WORKER_SECRET?.trim();
  if (s) return s;
  return undefined;
}

interface OutgoingMessage {
  to: string;
  subject: string;
  html: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

function bearer(request: Request): string | null {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

async function sendOne(env: Env, m: OutgoingMessage): Promise<void> {
  const msg = createMimeMessage();
  msg.setSender({ name: env.FROM_NAME, addr: env.FROM_ADDR });
  msg.setRecipient(m.to.trim());
  msg.setSubject(m.subject);
  // Cloudflare send_email: charset 접미사 없이 text/html 만 허용
  msg.addMessage({
    contentType: "text/html",
    data: m.html,
  });
  const raw = msg.asRaw();
  await env.MAIL.send(new EmailMessage(env.FROM_ADDR, m.to.trim(), raw));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    /** Secret 설정 여부만 확인(값은 노출하지 않음). 브라우저에서 Worker URL 열어 확인 가능 */
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return json({
        ok: true,
        service: "transactional-mail",
        bearer_secret_configured: Boolean(workerBearerSecret(env)),
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    const sharedSecret = workerBearerSecret(env);
    if (!sharedSecret?.length) {
      return json(
        {
          ok: false,
          error: "worker_misconfigured",
          hint: "Cloudflare Secret: MAIL_WORKER_KEY 또는 MAIL_WORKER_SECRET 중 하나 설정 (Supabase와 동일 값)",
        },
        500,
      );
    }

    const token = bearer(request);
    if (!token || token !== sharedSecret) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400);
    }

    const b = body as Record<string, unknown>;
    let messages: OutgoingMessage[];

    if (Array.isArray(b.messages)) {
      messages = b.messages as OutgoingMessage[];
    } else if (
      typeof b.to === "string" &&
      typeof b.subject === "string" &&
      typeof b.html === "string"
    ) {
      messages = [{ to: b.to, subject: b.subject, html: b.html }];
    } else {
      return json(
        { ok: false, error: "validation", hint: "단건 { to, subject, html } 또는 { messages: [...] }" },
        400,
      );
    }

    if (messages.length === 0 || messages.length > 20) {
      return json({ ok: false, error: "validation", hint: "1~20통" }, 400);
    }

    for (const m of messages) {
      if (!m?.to || !m?.subject || !m?.html) {
        return json({ ok: false, error: "validation", fields: ["to", "subject", "html"] }, 400);
      }
      if (!isValidEmail(m.to)) {
        return json({ ok: false, error: "invalid_email", to: m.to }, 400);
      }
      const subj = String(m.subject).trim();
      const html = String(m.html);
      if (!subj || subj.length > MAX.subject) {
        return json({ ok: false, error: "invalid_subject" }, 400);
      }
      if (!html.length || html.length > MAX.html) {
        return json({ ok: false, error: "invalid_html" }, 400);
      }
    }

    try {
      for (const m of messages) {
        await sendOne(env, {
          to: m.to.trim(),
          subject: String(m.subject).trim(),
          html: String(m.html),
        });
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error("MAIL.send error:", detail);
      return json({ ok: false, error: "send_failed", detail }, 502);
    }

    return json({ ok: true, sent: messages.length }, 200);
  },
};
