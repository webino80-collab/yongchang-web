/**
 * send-register-mail
 * auth.users INSERT 트리거 → 신규 회원에게 환영 메일 발송
 * 현재 그누보드: bbs/register_form_update_mail1~3.php 대체
 *
 * Supabase Auth Webhook 또는 Database Webhook (auth.users) 으로 호출
 *
 * 환경변수:
 *   MAIL_WORKER_URL, MAIL_WORKER_KEY (구 MAIL_WORKER_SECRET), ADMIN_EMAIL, SITE_NAME, SITE_URL
 *   (Cloudflare Workers transactional-mail 발송 API)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getMailWorkerBearerToken, getMailWorkerUrl } from "../_shared/mail_worker_env.ts";

interface UserRecord {
  id: string;
  email: string;
  raw_user_meta_data?: {
    nickname?: string;
  };
  created_at: string;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    // Supabase Auth Webhook: body.user
    // Database Webhook: body.record
    const user: UserRecord = body.user ?? body.record;

    if (!user?.email) {
      return new Response(JSON.stringify({ skipped: "no email" }), {
        status: 200,
      });
    }

    const mailWorkerUrl = getMailWorkerUrl();
    const mailWorkerSecret = getMailWorkerBearerToken();
    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "admin@example.com";
    const siteName = Deno.env.get("SITE_NAME") ?? "사이트";
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://example.com";

    if (!mailWorkerUrl || !mailWorkerSecret) {
      console.error("MAIL_WORKER_URL or MAIL_WORKER_KEY (or MAIL_WORKER_SECRET) not set");
      return new Response("Mail config missing", { status: 500 });
    }

    const nickname =
      user.raw_user_meta_data?.nickname ?? user.email.split("@")[0];

    const emailHtml = `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;">
        <h1 style="color:#333;">${siteName}에 오신 것을 환영합니다!</h1>
        <p>안녕하세요, <strong>${nickname}</strong>님!<br/>
        회원가입이 완료되었습니다.</p>
        <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:24px 0;">
          <p style="margin:0;"><strong>가입 이메일:</strong> ${user.email}</p>
          <p style="margin:8px 0 0;"><strong>가입일:</strong> ${new Date(user.created_at).toLocaleString("ko-KR")}</p>
        </div>
        <a href="${siteUrl}"
           style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          사이트 방문하기
        </a>
        <p style="color:#888;font-size:12px;margin-top:32px;">
          본 메일은 자동 발송입니다. 가입하지 않으셨다면 무시하세요.
        </p>
      </div>
    `;

    const adminNotifyHtml = `<p>신규 회원이 가입했습니다.<br/>이메일: ${user.email}<br/>닉네임: ${nickname}</p>`;

    const mailRes = await fetch(mailWorkerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailWorkerSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            to: user.email,
            subject: `[${siteName}] 회원가입을 환영합니다!`,
            html: emailHtml,
          },
          {
            to: adminEmail,
            subject: `[${siteName}] 신규 회원 가입: ${nickname}`,
            html: adminNotifyHtml,
          },
        ],
      }),
    });

    if (!mailRes.ok) {
      const t = await mailRes.text();
      console.error("mail worker failed:", mailRes.status, t);
      return new Response("Mail send failed", { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("send-register-mail error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
