import { supabase } from "./supabaseClient";
import type { Brochure } from "@/types";

/*
  Supabase SQL (관리자 콘솔에서 실행):

  create table brochures (
    id uuid primary key default gen_random_uuid(),
    title_ko text not null,
    title_en text,
    desc_ko text,
    desc_en text,
    cover_image_url text,
    file_url text,
    file_size bigint,
    sort_order int not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
  );

  -- RLS
  alter table brochures enable row level security;
  create policy "public read active" on brochures for select using (is_active = true);
  create policy "admin all" on brochures for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

  -- Storage: brochure-files 버킷 생성 (public)
  insert into storage.buckets (id, name, public) values ('brochure-files', 'brochure-files', true);
  create policy "public read brochure-files" on storage.objects for select using (bucket_id = 'brochure-files');
  create policy "admin upload brochure-files" on storage.objects for insert with check (
    bucket_id = 'brochure-files' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
  create policy "admin delete brochure-files" on storage.objects for delete using (
    bucket_id = 'brochure-files' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
*/

/** 빈 문자열 → null (PostgREST/스키마와 충돌·400 방지) */
function normalizeBrochureRow(
  payload: Omit<Brochure, "id" | "created_at">
): Omit<Brochure, "id" | "created_at"> {
  const z = (s: string | null | undefined) => (s == null || s === "" ? null : s);
  return {
    title_ko: payload.title_ko.trim(),
    title_en: z(payload.title_en),
    desc_ko: z(payload.desc_ko),
    desc_en: z(payload.desc_en),
    cover_image_url: z(payload.cover_image_url),
    file_url: z(payload.file_url),
    file_size: payload.file_size,
    category: payload.category,
    sort_order: payload.sort_order,
    is_active: payload.is_active,
  };
}

function normalizeBrochurePatch(
  payload: Partial<Omit<Brochure, "id" | "created_at">>
): Partial<Omit<Brochure, "id" | "created_at">> {
  const z = (s: string | null | undefined) => (s == null || s === "" ? null : s);
  const out: Partial<Omit<Brochure, "id" | "created_at">> = { ...payload };
  if ("title_ko" in out && typeof out.title_ko === "string") out.title_ko = out.title_ko.trim();
  for (const key of ["title_en", "desc_ko", "desc_en", "cover_image_url", "file_url"] as const) {
    if (key in out) out[key] = z(out[key] as string | null | undefined) as never;
  }
  return out;
}

export const brochureService = {
  async getActiveBrochures(): Promise<Brochure[]> {
    const { data, error } = await supabase
      .from("brochures")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data as Brochure[];
  },

  async getAllBrochures(): Promise<Brochure[]> {
    const { data, error } = await supabase
      .from("brochures")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data as Brochure[];
  },

  async createBrochure(payload: Omit<Brochure, "id" | "created_at">): Promise<Brochure> {
    const row = normalizeBrochureRow(payload);
    const { data, error } = await supabase.from("brochures").insert(row).select().single();
    if (error) throw error;
    return data as Brochure;
  },

  async updateBrochure(id: string, payload: Partial<Omit<Brochure, "id" | "created_at">>): Promise<Brochure> {
    const row = normalizeBrochurePatch(payload);
    const { data, error } = await supabase
      .from("brochures")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Brochure;
  },

  async deleteBrochure(id: string): Promise<void> {
    const { error } = await supabase.from("brochures").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadCoverImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("brochure-files").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("brochure-files").getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadFile(file: File): Promise<{ url: string; size: number }> {
    const ext = file.name.split(".").pop();
    const path = `pdfs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("brochure-files").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("brochure-files").getPublicUrl(path);
    return { url: data.publicUrl, size: file.size };
  },

  async deleteStorageFile(url: string): Promise<void> {
    const path = url.split("/brochure-files/")[1];
    if (!path) return;
    await supabase.storage.from("brochure-files").remove([path]);
  },

  formatFileSize(bytes: number | null): string {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  },

  async reorderBrochures(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, idx) =>
        supabase.from("brochures").update({ sort_order: idx + 1 }).eq("id", id)
      )
    );
  },
};
