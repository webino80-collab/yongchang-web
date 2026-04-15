/**
 * send-contact-mail
 *
 * 호출: (1) 클라이언트가 `contact_inquiries` INSERT 직후 `functions.invoke`
 *       (2) 선택: Database Webhook — 이 경우 (1)과 동시에 쓰면 메일이 중복됩니다. 웹훅을 끄세요.
 *
 * 발송: MAIL_WORKER_URL + MAIL_WORKER_SECRET → Cloudflare Workers `send_email` (transactional-mail)
 * 보조: SMTP_USER + SMTP_PASS 설정 시 SMTP (MAIL_WORKER 미설정 시)
 *
 * Secrets:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (DB 행 검증용, 권장)
 *   MAIL_WORKER_URL, MAIL_WORKER_SECRET
 *   ADMIN_EMAIL (기본 ycpbm@hanmail.net)
 *   SMTP_* (선택)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendContactInquiryViaSmtp } from "../_shared/send_contact_smtp.ts";

const NOTIFY_SUBJECT =
  "[신규 문의 접수] 홈페이지를 통해 새로운 문의가 도착했습니다";

interface ContactPayload {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  created_at: string;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateRecord(record: ContactPayload): string | null {
  const name = String(record.name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const subject = String(record.subject ?? "").trim();
  const message = String(record.message ?? "").trim();
  if (!record.id || typeof record.id !== "string") return "id";
  if (!name || name.length > 80) return "name";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";
  if (!subject || subject.length > 200) return "subject";
  if (message.length < 10 || message.length > 4000) return "message";
  const phone = String(record.phone ?? "").trim();
  if (phone.length > 40) return "phone";
  return null;
}

async function verifyContactRowMatchesDb(record: ContactPayload): Promise<boolean> {
  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) {
    console.error("send-contact-mail: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음 — 검증 생략 불가");
    return false;
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("contact_inquiries")
    .select("name,email,phone,subject,message")
    .eq("id", record.id)
    .maybeSingle();

  if (error || !data) return false;

  const norm = (s: string | null | undefined) => String(s ?? "").trim();
  const normMsg = (s: string | null | undefined) =>
    norm(s).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const pe = norm(record.email).toLowerCase();
  const de = norm(data.email).toLowerCase();
  return (
    norm(data.name) === norm(record.name) &&
    de === pe &&
    norm(data.subject) === norm(record.subject) &&
    normMsg(data.message) === normMsg(record.message) &&
    norm(data.phone ?? "") === norm(record.phone ?? "")
  );
}

function buildAdminNotifyHtml(record: ContactPayload): string {
  const phone = String(record.phone ?? "").trim() || "—";
  return `
<div style="font-family:sans-serif;max-width:640px;line-height:1.6;color:#222;">
  <p style="font-size:16px;margin:0 0 16px;">홈페이지를 통해 새로운 문의가 도착했습니다.</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;">
    <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f8f8f8;width:120px;font-weight:600;">이름</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(record.name)}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f8f8f8;font-weight:600;">연락처</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(phone)}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f8f8f8;font-weight:600;">제목</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(record.subject)}</td></tr>
    <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f8f8f8;font-weight:600;">이메일</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(record.email)}</td></tr>
  </table>
  <p style="font-size:13px;color:#555;margin:16px 0 8px;font-weight:600;">문의 내용</p>
  <div style="padding:12px;border:1px solid #ddd;border-radius:6px;background:#fafafa;white-space:pre-wrap;font-size:14px;">${escapeHtml(record.message)}</div>
  <p style="font-size:12px;color:#888;margin-top:20px;">문의 ID: ${escapeHtml(record.id)} · 접수일시: ${escapeHtml(record.created_at)}</p>
</div>`.trim();
}

async function sendViaMailWorker(adminEmail: string, record: ContactPayload): Promise<void> {
  const mailWorkerUrl = Deno.env.get("MAIL_WORKER_URL")?.replace(/\/$/, "");
  const mailWorkerSecret = Deno.env.get("MAIL_WORKER_SECRET")?.trim();
  if (!mailWorkerUrl || !mailWorkerSecret) {
    throw new Error("MAIL_WORKER_URL / MAIL_WORKER_SECRET 미설정");
  }

  const res = await fetch(mailWorkerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mailWorkerSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: adminEmail,
      subject: NOTIFY_SUBJECT,
      html: buildAdminNotifyHtml(record),
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`mail worker ${res.status}: ${t}`);
  }
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as { record?: ContactPayload };
    const record = body?.record;

    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const verr = validateRecord(record);
    if (verr) {
      console.error("send-contact-mail: validation", verr, record);
      return new Response(JSON.stringify({ ok: false, error: "validation", field: verr }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const verified = await verifyContactRowMatchesDb(record);
    if (!verified) {
      console.error("send-contact-mail: db verification failed", record.id);
      return new Response(JSON.stringify({ ok: false, error: "forbidden", detail: "row_mismatch" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL")?.trim() || "ycpbm@hanmail.net";

    const mailWorkerUrl = Deno.env.get("MAIL_WORKER_URL")?.trim();
    const mailWorkerSecret = Deno.env.get("MAIL_WORKER_SECRET")?.trim();

    if (mailWorkerUrl && mailWorkerSecret) {
      try {
        await sendViaMailWorker(adminEmail, record);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("send-contact-mail: mail worker failed", msg);
        return new Response(JSON.stringify({ ok: false, error: "mail_worker_failed", detail: msg }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, via: "mail_worker" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const smtpUser = Deno.env.get("SMTP_USER")?.trim();
    const smtpPass = Deno.env.get("SMTP_PASS")?.trim();

    if (smtpUser && smtpPass) {
      try {
        await sendContactInquiryViaSmtp(record);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("send-contact-mail: smtp failed", msg);
        return new Response(JSON.stringify({ ok: false, error: "smtp_failed", detail: msg }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, via: "smtp" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("send-contact-mail: MAIL_WORKER_* 또는 SMTP 미설정");
    return new Response(JSON.stringify({ ok: false, error: "mail_not_configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-contact-mail error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
