/**
 * send-contact-mail
 * contact_inquiries INSERT 트리거 → 관리자에게 문의 접수 메일 발송
 * 현재 그누보드: page/mail_send_update.php + lib/mailer.lib.php 대체
 *
 * 환경변수 (Supabase Dashboard > Edge Functions > Secrets):
 *   RESEND_API_KEY  - Resend.com API 키
 *   ADMIN_EMAIL     - 관리자 수신 이메일
 *   SITE_NAME       - 사이트 이름
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ContactPayload {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  created_at: string;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as { record?: ContactPayload };
    const record = body?.record;

    if (
      !record ||
      typeof record.name !== "string" ||
      typeof record.email !== "string" ||
      typeof record.subject !== "string" ||
      typeof record.message !== "string"
    ) {
      console.error("send-contact-mail: invalid or missing record", body);
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "admin@example.com";
    const siteName = Deno.env.get("SITE_NAME") ?? "사이트";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not set");
      return new Response("Mail config missing", { status: 500 });
    }

    const emailBody = `
      <h2>[${siteName}] 새 문의가 접수되었습니다.</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><th style="background:#f5f5f5;padding:8px;text-align:left;width:120px;">이름</th><td style="padding:8px;">${record.name}</td></tr>
        <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">이메일</th><td style="padding:8px;">${record.email}</td></tr>
        <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">연락처</th><td style="padding:8px;">${record.phone ?? "-"}</td></tr>
        <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">제목</th><td style="padding:8px;">${record.subject}</td></tr>
        <tr><th style="background:#f5f5f5;padding:8px;text-align:left;vertical-align:top;">내용</th><td style="padding:8px;white-space:pre-wrap;">${record.message}</td></tr>
        <tr><th style="background:#f5f5f5;padding:8px;text-align:left;">접수일시</th><td style="padding:8px;">${record.created_at}</td></tr>
      </table>
    `;

    // 문의자에게 자동 회신 메일
    const autoReplyBody = `
      <h2>문의가 접수되었습니다.</h2>
      <p>안녕하세요, <strong>${record.name}</strong>님.<br/>
      아래 내용으로 문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.</p>
      <hr/>
      <p><strong>제목:</strong> ${record.subject}</p>
      <p><strong>내용:</strong><br/><pre style="white-space:pre-wrap;">${record.message}</pre></p>
      <hr/>
      <p style="color:#888;font-size:12px;">본 메일은 자동 발송입니다. 회신하지 마세요.</p>
    `;

    const resendUrl = "https://api.resend.com/emails";
    // Resend 무료 플랜 기본 발신 주소 (도메인 인증 전까지 사용)
    const fromAddress = `${siteName} <onboarding@resend.dev>`;

    // 관리자 알림 메일
    const adminRes = await fetch(resendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [adminEmail],
        subject: `[문의] ${record.subject} - ${record.name}`,
        html: emailBody,
        reply_to: record.email,
      }),
    });
    if (!adminRes.ok) {
      const err = await adminRes.text();
      console.error("관리자 메일 발송 실패:", err);
      return new Response(
        JSON.stringify({ ok: false, error: "admin_mail_failed", detail: err }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 문의자 자동 회신
    const replyRes = await fetch(resendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [record.email],
        subject: `[${siteName}] 문의가 접수되었습니다: ${record.subject}`,
        html: autoReplyBody,
      }),
    });
    if (!replyRes.ok) {
      const err = await replyRes.text();
      console.error("자동회신 발송 실패:", err);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-contact-mail error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
