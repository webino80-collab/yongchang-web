import { supabase } from "./supabaseClient";
import type { ContactInquiry } from "@/types";

export const contactService = {
  /**
   * 문의 저장 후 메일은 Supabase Database Webhook → Edge Function `send-contact-mail`에서
   * SMTP(다음 등) 또는 선택적 Cloudflare Worker로 발송합니다.
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
      phone: payload.phone,
      subject: payload.subject,
      message: payload.message,
    };
    const { error } = await supabase.from("contact_inquiries").insert(row);
    if (error) throw error;
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
