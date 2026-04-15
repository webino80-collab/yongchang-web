/**
 * send-reply-notification
 * posts INSERT (parent_id가 있는 경우) 트리거 → 원글 작성자에게 답글 알림
 * 현재 그누보드: bbs/write_update_mail.php 대체
 *
 * 환경변수:
 *   MAIL_WORKER_URL, MAIL_WORKER_SECRET, SITE_NAME, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   (Cloudflare Workers transactional-mail 발송 API)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PostRecord {
  id: string;
  board_id: string;
  author_id: string | null;
  author_name: string | null;
  subject: string;
  parent_id: string | null;
  created_at: string;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { record } = (await req.json()) as { record: PostRecord };

    // 답글이 아닌 경우 무시
    if (!record.parent_id) {
      return new Response(JSON.stringify({ skipped: "not a reply" }), {
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailWorkerUrl = Deno.env.get("MAIL_WORKER_URL")?.replace(/\/$/, "");
    const mailWorkerSecret = Deno.env.get("MAIL_WORKER_SECRET");
    const siteName = Deno.env.get("SITE_NAME") ?? "사이트";

    if (!mailWorkerUrl || !mailWorkerSecret) {
      console.error("MAIL_WORKER_URL or MAIL_WORKER_SECRET not set");
      return new Response("Mail config missing", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 원글 작성자 정보 조회
    const { data: parentPost } = await supabase
      .from("posts")
      .select("author_id, subject, author_name")
      .eq("id", record.parent_id)
      .single();

    if (!parentPost?.author_id) {
      return new Response(JSON.stringify({ skipped: "no parent author" }), {
        status: 200,
      });
    }

    // 원글 작성자의 이메일 조회
    const { data: authorData } = await supabase.auth.admin.getUserById(
      parentPost.author_id
    );

    if (!authorData?.user?.email) {
      return new Response(JSON.stringify({ skipped: "no author email" }), {
        status: 200,
      });
    }

    const replyAuthor = record.author_name ?? "익명";
    const emailHtml = `
      <h2>[${siteName}] 내 글에 답글이 등록되었습니다.</h2>
      <p>작성하신 글 <strong>"${parentPost.subject}"</strong>에 새로운 답글이 등록되었습니다.</p>
      <ul>
        <li><strong>답글 작성자:</strong> ${replyAuthor}</li>
        <li><strong>답글 제목:</strong> ${record.subject}</li>
        <li><strong>등록일:</strong> ${record.created_at}</li>
      </ul>
      <p style="color:#888;font-size:12px;">이 메일은 자동으로 발송됩니다.</p>
    `;

    const mailRes = await fetch(mailWorkerUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mailWorkerSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: authorData.user.email,
        subject: `[${siteName}] 내 글에 답글이 달렸습니다.`,
        html: emailHtml,
      }),
    });

    if (!mailRes.ok) {
      const t = await mailRes.text();
      console.error("mail worker failed:", mailRes.status, t);
      return new Response("Mail send failed", { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("send-reply-notification error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
