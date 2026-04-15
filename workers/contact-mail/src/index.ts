/**
 * 문의 폼 → 관리자 메일 (Cloudflare Email Routing send_email)
 * 배포: cd workers/contact-mail && npm i && npx wrangler secret put CONTACT_MAIL_SECRET
 */
/// <reference types="@cloudflare/workers-types" />
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext/browser";

const FROM_ADDR = "no-reply@yongchang.co.kr";
const FROM_NAME = "(주)용창 문의";
const TO_ADDR = "ycpbm@hanmail.net";

const MAX = { name: 80, email: 254, subject: 200, message: 4000, phone: 40 } as const;

interface Env {
  NOTIFY: SendEmail;
  CONTACT_MAIL_SECRET: string;
  ALLOWED_ORIGINS?: string;
}

interface Body {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  /** 스팸 방지: 숨김 필드는 반드시 비어 있어야 함 */
  hp?: string;
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const o = origin ?? "";
  const allow =
    allowed.length === 0
      ? "*"
      : allowed.includes(o)
        ? o
        : allowed[0] ?? "";
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Contact-Mail-Secret",
    "Access-Control-Max-Age": "86400",
  };
  if (allow === "*") {
    h["Access-Control-Allow-Origin"] = "*";
  } else if (allow) {
    h["Access-Control-Allow-Origin"] = allow;
    h["Vary"] = "Origin";
  }
  return h;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= MAX.email;
}

function clamp(s: string, max: number): string {
  const t = String(s ?? "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const ch = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: ch });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, ch);
    }

    if (!env.CONTACT_MAIL_SECRET?.length) {
      return json({ ok: false, error: "worker_misconfigured" }, 500, ch);
    }

    const allowed = (env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length > 0 && origin && !allowed.includes(origin)) {
      return json({ ok: false, error: "origin_not_allowed" }, 403, ch);
    }

    const secret = request.headers.get("X-Contact-Mail-Secret");
    if (!secret || secret !== env.CONTACT_MAIL_SECRET) {
      return json({ ok: false, error: "unauthorized" }, 401, ch);
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return json({ ok: false, error: "invalid_json" }, 400, ch);
    }

    if (body.hp != null && String(body.hp).trim() !== "") {
      return json({ ok: false, error: "rejected" }, 400, ch);
    }

    const name = clamp(body.name ?? "", MAX.name);
    const email = clamp(body.email ?? "", MAX.email).toLowerCase();
    const phone = clamp(body.phone ?? "", MAX.phone);
    const subject = clamp(body.subject ?? "", MAX.subject);
    const message = clamp(body.message ?? "", MAX.message);

    if (!name || !email || !subject || !message) {
      return json({ ok: false, error: "validation", fields: ["name", "email", "subject", "message"] }, 400, ch);
    }
    if (!isValidEmail(email)) {
      return json({ ok: false, error: "invalid_email" }, 400, ch);
    }
    if (message.length < 10) {
      return json({ ok: false, error: "message_too_short" }, 400, ch);
    }

    const plain = [
      `[${FROM_NAME}] 새 문의`,
      "",
      `이름: ${name}`,
      `이메일: ${email}`,
      `연락처: ${phone || "-"}`,
      `제목: ${subject}`,
      "",
      "내용:",
      message,
    ].join("\n");

    const msg = createMimeMessage();
    msg.setSender({ name: FROM_NAME, addr: FROM_ADDR });
    msg.setRecipient(TO_ADDR);
    msg.setSubject(`[문의] ${subject} — ${name}`);
    msg.addMessage({
      contentType: "text/plain; charset=UTF-8",
      data: plain,
    });

    const raw = msg.asRaw();
    const em = new EmailMessage(FROM_ADDR, TO_ADDR, raw);

    try {
      await env.NOTIFY.send(em);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      return json({ ok: false, error: "send_failed", detail: m }, 502, ch);
    }

    return json({ ok: true }, 200, ch);
  },
};
