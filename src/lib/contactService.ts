import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { ContactInquiry } from "@/types";
import type { Database } from "./database.types";

async function messageFromFunctionsHttpError(err: FunctionsHttpError): Promise<string> {
  try {
    const body = await err.context.json();
    const o = body as { error?: string; detail?: string };
    const parts = [o.error, o.detail].filter(Boolean);
    if (parts.length) return parts.join(" — ");
  } catch {
    /* ignore */
  }
  return err.message;
}

type CreatedContactRow = Database["public"]["Functions"]["create_contact_inquiry"]["Returns"];

function unwrapCreateContactRow(data: unknown): CreatedContactRow {
  if (data == null) throw new Error("create_contact_inquiry returned empty");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object" || !("id" in row)) {
    throw new Error("create_contact_inquiry returned invalid row");
  }
  return row as CreatedContactRow;
}

export const contactService = {
  /**
   * 1) `contact_inquiries`에 저장
   * 2) 저장 직후 Edge Function `send-contact-mail` 호출 → Cloudflare `MAIL_WORKER`(send_email)로 관리자 알림
   *
   * Database Webhook으로 동일 함수를 호출 중이면 메일이 두 번 갑니다. 웹훅을 끄거나 이 invoke 경로만 쓰세요.
   */
  async submit(payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    /** 숨김 필드(스팸 방지) — DB에 저장하지 않음 */
    hp?: string;
  }): Promise<{
    mailSent: boolean;
    /** mailSent 가 false 일 때 Edge JSON 의 reason (예: mail_not_configured, missing_service_role) */
    mailSkipReason?: string;
    mailSkipHint?: string;
  }> {
    // anon은 contact_inquiries SELECT RLS로 insert().select() 불가 → RPC로 INSERT 후 행 반환
    const { data, error } = await supabase.rpc("create_contact_inquiry", {
      p_name: payload.name,
      p_email: payload.email,
      p_phone: payload.phone?.trim() ?? "",
      p_subject: payload.subject,
      p_message: payload.message,
    });

    if (error) throw error;

    const row = unwrapCreateContactRow(data);

    type MailFnBody = {
      ok?: boolean;
      mailSent?: boolean;
      reason?: string;
      hint?: string;
      detail?: string;
      error?: string;
    };

    const { data: fnData, error: fnError } = await supabase.functions.invoke<MailFnBody>("send-contact-mail", {
      body: { record: row },
    });

    if (fnError) {
      console.error("send-contact-mail invoke:", fnError);
      if (fnError instanceof FunctionsHttpError) {
        throw new Error(await messageFromFunctionsHttpError(fnError));
      }
      throw fnError;
    }

    const out = fnData;
    if (out && out.ok === false) {
      throw new Error(
        [out.error, out.detail].filter(Boolean).join(" — ") || "send-contact-mail rejected",
      );
    }

    const mailSent = out?.mailSent !== false;
    return {
      mailSent,
      mailSkipReason: mailSent ? undefined : out?.reason,
      mailSkipHint: mailSent ? undefined : (out?.hint ?? out?.detail),
    };
  },

  // 관리자 전용
  async getInquiries(
    page = 1,
    perPage = 20,
    onlyUnread = false
  ): Promise<{ data: ContactInquiry[]; total: number }> {
    let query = supabase
      .from("contact_inquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1);

    if (onlyUnread) query = query.eq("is_read", false);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data as ContactInquiry[], total: count ?? 0 };
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from("contact_inquiries")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
  },

  async sendReply(id: string, replyContent: string) {
    const { error } = await supabase
      .from("contact_inquiries")
      .update({ reply_content: replyContent, replied_at: new Date().toISOString(), is_read: true })
      .eq("id", id);
    if (error) throw error;

    // send-inquiry-reply: 게이트웨이 verify_jwt off, 함수 내부에서 Bearer 검사. invoke 시 세션 토큰 명시.
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionErr || !accessToken) {
      throw new Error("로그인 세션이 없습니다. 다시 로그인한 뒤 답변 저장을 시도해 주세요.");
    }

    const { error: fnError } = await supabase.functions.invoke("send-inquiry-reply", {
      body: { inquiry_id: id, reply_content: replyContent },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (fnError) {
      console.error("send-inquiry-reply invoke:", fnError);
      if (fnError instanceof FunctionsHttpError) {
        throw new Error(await messageFromFunctionsHttpError(fnError));
      }
      throw fnError;
    }
  },

  async deleteInquiry(id: string) {
    // RPC: 테이블 DELETE RLS 누락·불일치여도 관리자면 실제 삭제 (027 delete_contact_inquiry)
    const { data, error } = await supabase.rpc("delete_contact_inquiry", { p_id: id });
    if (error) throw error;
    if (data !== true) {
      throw new Error("해당 문의를 찾을 수 없거나 이미 삭제되었습니다.");
    }
  },
};
