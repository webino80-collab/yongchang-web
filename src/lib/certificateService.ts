import { supabase } from "./supabaseClient";
import type { Certificate } from "@/types";

/*
  Supabase SQL (관리자 콘솔에서 실행):

  create table certificates (
    id uuid primary key default gen_random_uuid(),
    title_ko text not null,
    title_en text,
    cert_type text not null default 'certificate',
    image_url text,
    issued_by text,
    issued_year text,
    sort_order int not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
  );

  -- RLS
  alter table certificates enable row level security;
  create policy "public read active" on certificates for select using (is_active = true);
  create policy "admin all" on certificates for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

  -- Storage: cert-images 버킷 생성 (public)
  insert into storage.buckets (id, name, public) values ('cert-images', 'cert-images', true);
  create policy "public read cert-images" on storage.objects for select using (bucket_id = 'cert-images');
  create policy "admin upload cert-images" on storage.objects for insert with check (
    bucket_id = 'cert-images' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
  create policy "admin delete cert-images" on storage.objects for delete using (
    bucket_id = 'cert-images' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
*/

function normalizeCertificateRow(
  payload: Omit<Certificate, "id" | "created_at">
): Omit<Certificate, "id" | "created_at"> {
  const z = (s: string | null | undefined) => (s == null || s === "" ? null : s);
  return {
    title_ko: payload.title_ko.trim(),
    title_en: z(payload.title_en),
    cert_type: payload.cert_type || "certificate",
    image_url: z(payload.image_url),
    issued_by: z(payload.issued_by),
    issued_year: z(payload.issued_year),
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  };
}

function normalizeCertificatePatch(
  payload: Partial<Omit<Certificate, "id" | "created_at">>
): Partial<Omit<Certificate, "id" | "created_at">> {
  const z = (s: string | null | undefined) => (s == null || s === "" ? null : s);
  const out: Partial<Omit<Certificate, "id" | "created_at">> = { ...payload };
  if ("title_ko" in out && typeof out.title_ko === "string") out.title_ko = out.title_ko.trim();
  for (const key of ["title_en", "image_url", "issued_by", "issued_year"] as const) {
    if (key in out) out[key] = z(out[key] as string | null | undefined) as never;
  }
  return out;
}

/** 관리자·라이트박스 라벨 (DB cert_type 값과 1:1) */
export const CERT_TYPES: { value: string; labelKo: string; labelEn: string }[] = [
  { value: "patent", labelKo: "특허증", labelEn: "Patent" },
  { value: "design", labelKo: "디자인등록증", labelEn: "Design Registration" },
  { value: "certificate", labelKo: "인증서", labelEn: "Certificate" },
  { value: "confirmation", labelKo: "확인서", labelEn: "Confirmation" },
  { value: "permit", labelKo: "허가증", labelEn: "Permit" },
  { value: "iso", labelKo: "ISO", labelEn: "ISO" },
  { value: "other", labelKo: "기타", labelEn: "Other" },
];

/** 공개 페이지 상단 필터 탭 순서 (운영 yongchang.co.kr 과 동일) */
export const CERT_PAGE_TAB_VALUES = ["patent", "design", "certificate", "confirmation", "permit"] as const;

export const certificateService = {
  async getActiveCertificates(): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data as Certificate[];
  },

  async getAllCertificates(): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data as Certificate[];
  },

  async createCertificate(payload: Omit<Certificate, "id" | "created_at">): Promise<Certificate> {
    const row = normalizeCertificateRow(payload);
    const { data, error } = await supabase.from("certificates").insert(row).select().single();
    if (error) throw error;
    return data as Certificate;
  },

  async updateCertificate(id: string, payload: Partial<Omit<Certificate, "id" | "created_at">>): Promise<Certificate> {
    const row = normalizeCertificatePatch(payload);
    const { data, error } = await supabase
      .from("certificates")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Certificate;
  },

  async deleteCertificate(id: string): Promise<void> {
    const { error } = await supabase.from("certificates").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `certs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("cert-images").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("cert-images").getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    const path = url.split("/cert-images/")[1];
    if (!path) return;
    await supabase.storage.from("cert-images").remove([path]);
  },

  async reorderCertificates(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, idx) =>
        supabase.from("certificates").update({ sort_order: idx + 1 }).eq("id", id)
      )
    );
  },
};
