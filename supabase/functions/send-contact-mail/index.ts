/**
 * send-contact-mail (Supabase Database Webhook — contact_inquiries INSERT)
 *
 * 1) SMTP (다음/한메일 등): SMTP_USER + SMTP_PASS 설정 시 `send_contact_smtp.ts` 사용
 * 2) 보조: CF Worker — CF_CONTACT_MAIL_WORKER_URL + CF_CONTACT_MAIL_SECRET (SMTP 미설정 시)
 *
 * Secrets 예시 (다음 메일):
 *   SMTP_HOST=smtp.daum.net
 *   SMTP_PORT=465
 *   SMTP_USER=발신계정@daum.net
 *   SMTP_PASS=****
 *   SMTP_FROM=no-reply@yongchang.co.kr   (실제로 다음 SMTP에 로그인 가능한 주소여야 함)
 *   ADMIN_EMAIL=ycpbm@hanmail.net
 *   SITE_NAME=(주)용창
 *
 * 587 + STARTTLS: SMTP_PORT=587, SMTP_STARTTLS=1, connection은 STARTTLS 경로
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendContactInquiryViaSmtp } from "../_shared/send_contact_smtp.ts";

interface ContactPayload {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
}

function validateRecord(record: ContactPayload): string | null {
  const name = String(record.name ?? "").trim();
  const email = String(record.email ?? "").trim();
  const subject = String(record.subject ?? "").trim();
  const message = String(record.message ?? "").trim();
  if (!name || name.length > 80) return "name";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "email";
  if (!subject || subject.length > 200) return "subject";
  if (message.length < 10 || message.length > 4000) return "message";
  const phone = String(record.phone ?? "").trim();
  if (phone.length > 40) return "phone";
  return null;
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

    const workerUrl = Deno.env.get("CF_CONTACT_MAIL_WORKER_URL")?.trim();
    const workerSecret = Deno.env.get("CF_CONTACT_MAIL_SECRET")?.trim();

    if (workerUrl && workerSecret) {
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Contact-Mail-Secret": workerSecret,
        },
        body: JSON.stringify({
          name: record.name,
          email: record.email,
          phone: record.phone ?? "",
          subject: record.subject,
          message: record.message,
          hp: "",
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        console.error("send-contact-mail: worker failed", res.status, t);
        return new Response(JSON.stringify({ ok: false, error: "worker_failed", detail: t }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true, via: "worker" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("send-contact-mail: SMTP·Worker 미설정 — 메일 미발송");
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-contact-mail error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
