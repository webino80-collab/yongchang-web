/**
 * send-inquiry-reply
 * 관리자가 문의 답변 저장 시 → 문의자 이메일로 답변 내용 발송
 *
 * 호출: 관리자 로그인 상태에서 supabase.functions.invoke (contactService.sendReply 이후)
 *
 * Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *          MAIL_WORKER_URL, MAIL_WORKER_SECRET (권장) 또는 SMTP_*
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendHtmlToAddressViaSmtp } from "../_shared/send_contact_smtp.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function withCors(
  body: BodyInit | null,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normMsg(s: string | null | undefined): string {
  return String(s ?? "")
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

interface InquiryRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  reply_content: string | null;
  created_at: string;
}

async function sendViaMailWorker(to: string, subject: string, html: string): Promise<void> {
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
    body: JSON.stringify({ to, subject, html }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`mail worker ${res.status}: ${t}`);
  }
}

function buildReplyEmailHtml(row: InquiryRow, replyBody: string, siteName: string): string {
  return `
<div style="font-family:sans-serif;max-width:640px;line-height:1.6;color:#222;">
  <p style="font-size:16px;">${escapeHtml(siteName)} 문의에 답변이 등록되었습니다.</p>
  <p style="font-size:14px;color:#555;">안녕하세요, <strong>${escapeHtml(row.name)}</strong>님</p>
  <table style="border-collapse:collapse;width:100%;font-size:14px;margin:16px 0;">
    <tr><td style="padding:8px 12px;border:1px solid #ddd;background:#f8f8f8;width:100px;font-weight:600;">문의 제목</td>
        <td style="padding:8px 12px;border:1px solid #ddd;">${escapeHtml(row.subject)}</td></tr>
  </table>
  <p style="font-size:13px;color:#555;font-weight:600;margin-bottom:8px;">문의하신 내용</p>
  <div style="padding:12px;border:1px solid #eee;border-radius:6px;background:#fafafa;white-space:pre-wrap;font-size:14px;margin-bottom:20px;">${escapeHtml(row.message)}</div>
  <p style="font-size:13px;color:#555;font-weight:600;margin-bottom:8px;">답변</p>
  <div style="padding:12px;border:1px solid #00008122;border-radius:6px;background:#f0f4ff;white-space:pre-wrap;font-size:14px;">${escapeHtml(replyBody)}</div>
  <p style="font-size:12px;color:#888;margin-top:24px;">접수일: ${escapeHtml(row.created_at)} · 문의 ID: ${escapeHtml(row.id)}</p>
  <p style="font-size:12px;color:#888;">본 메일은 발신 전용입니다. 추가 문의는 홈페이지 문의하기를 이용해 주세요.</p>
</div>`.trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return withCors(null, 204);
  }

  if (req.method !== "POST") {
    return withCors("Method Not Allowed", 405, { "Content-Type": "text/plain; charset=utf-8" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return withCors(JSON.stringify({ ok: false, error: "unauthorized" }), 401, {
      "Content-Type": "application/json",
    });
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !anonKey || !serviceKey) {
    return withCors(JSON.stringify({ ok: false, error: "server_misconfigured" }), 500, {
      "Content-Type": "application/json",
    });
  }

  try {
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return withCors(JSON.stringify({ ok: false, error: "invalid_session" }), 401, {
        "Content-Type": "application/json",
      });
    }

    const admin = createClient(url, serviceKey);
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profErr || !profile?.is_admin) {
      return withCors(JSON.stringify({ ok: false, error: "forbidden" }), 403, {
        "Content-Type": "application/json",
      });
    }

    let body: { inquiry_id?: string; reply_content?: string };
    try {
      body = (await req.json()) as { inquiry_id?: string; reply_content?: string };
    } catch {
      return withCors(JSON.stringify({ ok: false, error: "invalid_json" }), 400, {
        "Content-Type": "application/json",
      });
    }

    const inquiryId = String(body.inquiry_id ?? "").trim();
    const replyContent = String(body.reply_content ?? "").trim();
    const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      inquiryId,
    );
    if (!uuidOk || !replyContent.length || replyContent.length > 20_000) {
      return withCors(JSON.stringify({ ok: false, error: "validation" }), 400, {
        "Content-Type": "application/json",
      });
    }

    const { data: row, error: rowErr } = await admin
      .from("contact_inquiries")
      .select("id,name,email,subject,message,reply_content,created_at")
      .eq("id", inquiryId)
      .maybeSingle();

    if (rowErr || !row) {
      return withCors(JSON.stringify({ ok: false, error: "not_found" }), 404, {
        "Content-Type": "application/json",
      });
    }

    const r = row as InquiryRow;
    if (normMsg(r.reply_content) !== normMsg(replyContent)) {
      return withCors(JSON.stringify({ ok: false, error: "reply_mismatch", detail: "저장된 답변과 일치하지 않습니다." }), 409, {
        "Content-Type": "application/json",
      });
    }

    const email = String(r.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return withCors(JSON.stringify({ ok: false, error: "invalid_inquirer_email" }), 400, {
        "Content-Type": "application/json",
      });
    }

    const siteName = Deno.env.get("SITE_NAME")?.trim() || "(주)용창";
    const subject = `[${siteName}] 문의하신 내용에 답변이 등록되었습니다`;
    const html = buildReplyEmailHtml(r, replyContent, siteName);
    const text = [
      `${siteName} 문의 답변`,
      "",
      `문의 제목: ${r.subject}`,
      "",
      "문의 내용:",
      r.message,
      "",
      "답변:",
      replyContent,
    ].join("\n");

    const mailUrl = Deno.env.get("MAIL_WORKER_URL")?.trim();
    const mailSecret = Deno.env.get("MAIL_WORKER_SECRET")?.trim();
    const smtpUser = Deno.env.get("SMTP_USER")?.trim();
    const smtpPass = Deno.env.get("SMTP_PASS")?.trim();

    if (mailUrl && mailSecret) {
      try {
        await sendViaMailWorker(email, subject, html);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("send-inquiry-reply: mail worker", msg);
        return withCors(JSON.stringify({ ok: false, error: "mail_worker_failed", detail: msg }), 502, {
          "Content-Type": "application/json",
        });
      }
    } else if (smtpUser && smtpPass) {
      try {
        await sendHtmlToAddressViaSmtp({
          to: email,
          subject,
          html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`,
          text,
          replyTo: Deno.env.get("ADMIN_EMAIL")?.trim() || undefined,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("send-inquiry-reply: smtp", msg);
        return withCors(JSON.stringify({ ok: false, error: "smtp_failed", detail: msg }), 502, {
          "Content-Type": "application/json",
        });
      }
    } else {
      return withCors(JSON.stringify({ ok: false, error: "mail_not_configured" }), 503, {
        "Content-Type": "application/json",
      });
    }

    return withCors(JSON.stringify({ ok: true }), 200, { "Content-Type": "application/json" });
  } catch (err) {
    console.error("send-inquiry-reply:", err);
    return withCors("Internal Server Error", 500, { "Content-Type": "text/plain; charset=utf-8" });
  }
});
