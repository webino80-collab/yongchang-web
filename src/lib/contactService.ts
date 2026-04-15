import { supabase } from "./supabaseClient";
import type { ContactInquiry } from "@/types";
import type { Database } from "./database.types";

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
  }): Promise<void> {
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

    const { error: fnError } = await supabase.functions.invoke("send-contact-mail", {
      body: { record: row },
    });

    if (fnError) {
      console.error("send-contact-mail invoke:", fnError);
      throw fnError;
    }
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

    const { error: fnError } = await supabase.functions.invoke("send-inquiry-reply", {
      body: { inquiry_id: id, reply_content: replyContent },
    });
    if (fnError) {
      console.error("send-inquiry-reply invoke:", fnError);
      throw fnError;
    }
  },

  async deleteInquiry(id: string) {
    // Returning: RLS로 0행 삭제 시에도 error 없이 성공할 수 있음 → 반환 행으로 검증
    const { data, error } = await supabase.from("contact_inquiries").delete().eq("id", id).select("id");
    if (error) throw error;
    if (!data?.length) {
      throw new Error(
        "문의가 삭제되지 않았습니다. 관리자 권한을 확인하고, Supabase에 마이그레이션 026(문의 삭제 RLS)이 적용됐는지 확인하세요.",
      );
    }
  },
};
