import { supabase } from "./supabaseClient";
import type { ContactInquiry } from "@/types";

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
    const row = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone?.trim() || null,
      subject: payload.subject,
      message: payload.message,
    };

    const { data, error } = await supabase
      .from("contact_inquiries")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("insert returned no row");

    const { error: fnError } = await supabase.functions.invoke("send-contact-mail", {
      body: { record: data },
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
  },
};
