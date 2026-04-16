/**
 * SMTP 메일 발송 Worker (Supabase Edge `MAIL_WORKER_URL` 등에서 호출)
 * - Authorization: Bearer <MAIL_WORKER_KEY> (wrangler secret 과 동일해야 함)
 * - 본문: transactional-mail 과 동일하게 단건 `{ to, subject, html }` 또는 `{ messages: [...] }`
 */
/// <reference types="@cloudflare/workers-types" />
import { LogLevel, WorkerMailer, type EmailOptions, type WorkerMailerOptions } from "worker-mailer";

interface Env {
  MAIL_WORKER_KEY: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  /** 미설정 시 SMTP_USER 과 동일하게 사용 */
  SMTP_FROM?: string;
  SMTP_FROM_NAME?: string;
  /** 답장 주소(선택) */
  ADMIN_EMAIL?: string;
}

interface OutgoingMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const MAX = { subject: 300, html: 400_000, messages: 20 } as const;

const corsJsonHeaders: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsJsonHeaders,
  });
}

function bearer(request: Request): string | null {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

function smtpConnectOptions(env: Env): WorkerMailerOptions {
  const host = (env.SMTP_HOST ?? "smtp.daum.net").trim();
  const port = Number((env.SMTP_PORT ?? "465").trim());
  const implicitTls = port === 465;
  return {
    host,
    port,
    secure: implicitTls,
    startTls: !implicitTls,
    credentials: {
      username: env.SMTP_USER.trim(),
      password: env.SMTP_PASS,
    },
    authType: "plain",
    logLevel: LogLevel.WARN,
  };
}

function fromEnvelope(env: Env): EmailOptions["from"] {
  const email = (env.SMTP_FROM ?? env.SMTP_USER).trim();
  const name = (env.SMTP_FROM_NAME ?? "").trim();
  if (name) return { name, email };
  return email;
}

function toEmailOptions(env: Env, m: OutgoingMessage): EmailOptions {
  const reply = env.ADMIN_EMAIL?.trim();
  const base: EmailOptions = {
    from: fromEnvelope(env),
    to: { email: m.to.trim() },
    subject: String(m.subject).trim(),
    html: String(m.html),
  };
  if (m.text?.trim()) base.text = m.text.trim();
  if (reply && isValidEmail(reply)) {
    base.reply = { email: reply };
  }
  return base;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    if (!env.MAIL_WORKER_KEY?.length) {
      return json({ ok: false, error: "worker_misconfigured", hint: "MAIL_WORKER_KEY secret" }, 500);
    }

    const token = bearer(request);
    if (!token || token !== env.MAIL_WORKER_KEY) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }

    if (!env.SMTP_USER?.trim() || !env.SMTP_PASS?.length) {
      return json({ ok: false, error: "smtp_not_configured", hint: "SMTP_USER, SMTP_PASS secrets" }, 500);
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
      messages = [{ to: b.to, subject: b.subject, html: b.html, text: typeof b.text === "string" ? b.text : undefined }];
    } else {
      return json(
        { ok: false, error: "validation", hint: "단건 { to, subject, html } 또는 { messages: [...] }" },
        400,
      );
    }

    if (messages.length === 0 || messages.length > MAX.messages) {
      return json({ ok: false, error: "validation", hint: `1~${MAX.messages}통` }, 400);
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

    const smtpOpts = smtpConnectOptions(env);
    let mailer: Awaited<ReturnType<typeof WorkerMailer.connect>> | null = null;

    try {
      mailer = await WorkerMailer.connect(smtpOpts);
      for (const m of messages) {
        await mailer.send(toEmailOptions(env, m));
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      console.error("SMTP send error:", detail);
      return json({ ok: false, error: "send_failed", detail }, 502);
    } finally {
      if (mailer) {
        try {
          await mailer.close();
        } catch {
          /* ignore */
        }
      }
    }

    return json({ ok: true, sent: messages.length }, 200);
  },
};
