/**
 * productService — home_products 테이블 CRUD + Supabase Storage 이미지 업로드
 *
 * ★ Supabase에서 아래 SQL을 실행하세요:
 *
 * create table public.home_products (
 *   id          uuid primary key default gen_random_uuid(),
 *   title_ko    text not null,
 *   title_en    text not null,
 *   desc_ko     text,
 *   desc_en     text,
 *   image_url   text,
 *   link_url    text,
 *   sort_order  int  not null default 0,
 *   is_active   boolean not null default true,
 *   created_at  timestamptz not null default now()
 * );
 * alter table public.home_products enable row level security;
 *
 * create policy "public_read_active_products" on public.home_products
 *   for select using (is_active = true);
 *
 * create policy "admin_all_products" on public.home_products
 *   for all using (
 *     exists (
 *       select 1 from public.profiles
 *       where profiles.id = auth.uid() and profiles.is_admin = true
 *     )
 *   );
 *
 * ★ 초기 데이터 삽입 (현재 사이트 6개 제품):
 *
 * insert into public.home_products
 *   (title_ko, title_en, desc_ko, desc_en, link_url, sort_order) values
 *   ('메조니들','Meso Needles',
 *    '메조니들은 메조테라피 시술 시 약물을 진피층에 정교하게 전달하기 위해 설계된 초미세 주사 바늘입니다.',
 *    'Meso-needles are ultra-fine needles engineered for precise intradermal delivery during mesotherapy.',
 *    '/board/product/browse?cat=needle', 0),
 *   ('필러캐뉼라','Filler Cannula',
 *    '바늘 구멍 하나로 넓은 부위에 필러를 정교하게 채울 수 있어 멍과 부기를 최소화하고 시술 안전성을 높여줍니다.',
 *    'A single entry point allows precise filler delivery across a wide area, minimizing bruising and swelling.',
 *    '/board/product/browse?cat=cannula', 1),
 *   ('OSG 캐뉼라','OSG Cannula',
 *    '시술 시 조직 손상을 줄여 환자의 통증을 완화하고, 의사가 타겟 층에 정확하고 안전하게 약물을 주입할 수 있도록 돕습니다.',
 *    'Minimizes tissue trauma to alleviate patient pain and enables accurate, safe medication delivery.',
 *    '/board/product/browse?cat=cannula', 2),
 *   ('캐뉼라','Cannula',
 *    '일반 주사바늘에 비해 통증, 멍, 부종이 적고 한 번의 절개로 넓은 부위에 안전하고 균일한 시술이 가능합니다.',
 *    'Less pain, bruising and swelling than conventional needles; safe, uniform treatment via a single incision.',
 *    '/board/product/browse?cat=cannula', 3),
 *   ('척수마취용침','Spinal Needle',
 *    '척수마취, 뇌척수액 채취 또는 진단 목적의 주사 시 지주막하 공간에 접근하기 위해 설계된 정밀한 바늘.',
 *    'High-precision needles designed to access the subarachnoid space for spinal anesthesia or CSF collection.',
 *    '/board/product/browse?cat=anesthesia', 4),
 *   ('경막외투여용침','Epidural Needle',
 *    '마취 또는 진통을 위해 경막외 공간에 삽입하도록 설계된 견고한 바늘. 분만 시 또는 수술 후 통증 관리에 사용.',
 *    'A thick-walled needle for epidural anesthesia or analgesia, used in labor or post-operative pain management.',
 *    '/board/product/browse?cat=anesthesia', 5);
 *
 * ★ Supabase Storage에서 "product-images" 버킷을 Public으로 생성하세요 (선택).
 *   이미지를 업로드하지 않으면 기본 이미지(mainProducts_N.png)가 사용됩니다.
 */

import { supabase } from "./supabaseClient";
import type { HomeProduct } from "@/types";

const TABLE  = "home_products";
const BUCKET = "product-images";

export const productService = {
  /** 공개: 활성 제품만 sort_order 순 */
  async getActiveProducts(): Promise<HomeProduct[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as HomeProduct[]) ?? [];
  },

  /** 관리자: 전체 제품 */
  async getAllProducts(): Promise<HomeProduct[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as HomeProduct[]) ?? [];
  },

  /** 제품 생성 */
  async createProduct(input: {
    title_ko: string;
    title_en: string;
    desc_ko?: string;
    desc_en?: string;
    image_url?: string;
    link_url?: string;
    sort_order?: number;
  }): Promise<HomeProduct> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as HomeProduct;
  },

  /** 제품 수정 */
  async updateProduct(
    id: string,
    input: Partial<Omit<HomeProduct, "id" | "created_at">>
  ): Promise<HomeProduct> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as HomeProduct;
  },

  /** 제품 삭제 */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  /** 이미지 업로드 → Public URL 반환 */
  async uploadImage(file: File): Promise<string> {
    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Storage 이미지 삭제 */
  async deleteImage(url: string): Promise<void> {
    try {
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      await supabase.storage.from(BUCKET).remove([url.slice(idx + marker.length)]);
    } catch {
      // 무시
    }
  },

  /** sort_order 일괄 업데이트 */
  async reorderProducts(updates: { id: string; sort_order: number }[]): Promise<void> {
    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from(TABLE).update({ sort_order }).eq("id", id)
      )
    );
  },
};
