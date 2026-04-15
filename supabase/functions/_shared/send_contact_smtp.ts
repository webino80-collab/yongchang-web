/**
 * 다음(Daum)·한메일 등 SMTP 발송 (Supabase Edge / Deno)
 *
 * 환경변수 (Dashboard → Edge Functions → Secrets):
 *   SMTP_HOST     기본 smtp.daum.net
 *   SMTP_PORT     기본 465 (SSL). 587 + STARTTLS 는 SMTP_STARTTLS=1
 *   SMTP_USER     로그인 아이디(보통 전체 이메일)
 *   SMTP_PASS     비밀번호 또는 앱 비밀번호
 *   SMTP_FROM     발신 주소(헤더 From). 미설정 시 SMTP_USER
 *   ADMIN_EMAIL   관리자 수신 (기본 ycpbm@hanmail.net)
 *   SITE_NAME     선택
 */
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export interface ContactInquiryRecord {
  name: string;
  email: string;
  phone?: string;
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

/** 다음 메일 기본: smtp.daum.net:465 SSL */
export async function sendContactInquiryViaSmtp(record: ContactInquiryRecord): Promise<void> {
  const host = Deno.env.get("SMTP_HOST")?.trim() || "smtp.daum.net";
  const port = Number(Deno.env.get("SMTP_PORT")?.trim() || "465");
  /** 587 등 STARTTLS: SMTP_STARTTLS=1 로 설정하고 SMTP_PORT=587 */
  const startTls = Deno.env.get("SMTP_STARTTLS") === "1";
  const user = Deno.env.get("SMTP_USER")?.trim();
  const pass = Deno.env.get("SMTP_PASS")?.trim();
  const fromAddr = (Deno.env.get("SMTP_FROM")?.trim() || user || "").trim();
  const siteName = Deno.env.get("SITE_NAME")?.trim() || "(주)용창";
  const adminTo = Deno.env.get("ADMIN_EMAIL")?.trim() || "ycpbm@hanmail.net";

  if (!user || !pass || !fromAddr) {
    throw new Error("SMTP_USER, SMTP_PASS, SMTP_FROM(또는 SMTP_USER) Secret 이 필요합니다.");
  }

  const implicitTls = port === 465 && !startTls;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<h2>[${escapeHtml(siteName)}] 새 문의</h2>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
<tr><th style="background:#f5f5f5;padding:8px;text-align:left;width:120px;">이름</th><td style="padding:8px;">${escapeHtml(record.name)}</td></tr>
<tr><th style="background:#f5f5f5;padding:8px;text-align:left;">이메일</th><td style="padding:8px;">${escapeHtml(record.email)}</td></tr>
<tr><th style="background:#f5f5f5;padding:8px;text-align:left;">연락처</th><td style="padding:8px;">${escapeHtml(record.phone ?? "-")}</td></tr>
<tr><th style="background:#f5f5f5;padding:8px;text-align:left;">제목</th><td style="padding:8px;">${escapeHtml(record.subject)}</td></tr>
<tr><th style="background:#f5f5f5;padding:8px;text-align:left;vertical-align:top;">내용</th><td style="padding:8px;white-space:pre-wrap;">${escapeHtml(record.message)}</td></tr>
<tr><th style="background:#f5f5f5;padding:8px;text-align:left;">접수일시</th><td style="padding:8px;">${escapeHtml(record.created_at)}</td></tr>
</table></body></html>`;

  const plain = [
    `[${siteName}] 새 문의`,
    "",
    `이름: ${record.name}`,
    `이메일: ${record.email}`,
    `연락처: ${record.phone ?? "-"}`,
    `제목: ${record.subject}`,
    "",
    record.message,
    "",
    `접수: ${record.created_at}`,
  ].join("\n");

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: implicitTls,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({
      from: `${siteName} <${fromAddr}>`,
      to: adminTo,
      replyTo: record.email,
      subject: `[문의] ${record.subject} — ${record.name}`,
      content: plain,
      html,
    });
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}

/** 임의 수신자에게 HTML 메일 (문의 답변 알림 등) */
export async function sendHtmlToAddressViaSmtp(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  const host = Deno.env.get("SMTP_HOST")?.trim() || "smtp.daum.net";
  const port = Number(Deno.env.get("SMTP_PORT")?.trim() || "465");
  const startTls = Deno.env.get("SMTP_STARTTLS") === "1";
  const user = Deno.env.get("SMTP_USER")?.trim();
  const pass = Deno.env.get("SMTP_PASS")?.trim();
  const fromAddr = (Deno.env.get("SMTP_FROM")?.trim() || user || "").trim();
  const siteName = Deno.env.get("SITE_NAME")?.trim() || "(주)용창";

  if (!user || !pass || !fromAddr) {
    throw new Error("SMTP_USER, SMTP_PASS, SMTP_FROM(또는 SMTP_USER) Secret 이 필요합니다.");
  }

  const implicitTls = port === 465 && !startTls;

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: implicitTls,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({
      from: `${siteName} <${fromAddr}>`,
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      content: opts.text,
      html: opts.html,
    });
  } finally {
    try {
      await client.close();
    } catch {
      /* ignore */
    }
  }
}
