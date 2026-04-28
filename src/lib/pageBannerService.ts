import { supabase } from "./supabaseClient";
import type { PageBanner } from "@/types";

/*
  Supabase SQL (관리자 콘솔에서 실행):

  create table page_banners (
    id uuid primary key default gen_random_uuid(),
    page_key text not null unique,   -- 'product' | 'certificate' | 'brochure'
    image_url text,
    title_ko text,
    title_en text,
    subtitle_ko text,
    subtitle_en text,
    is_active boolean not null default true,
    updated_at timestamptz not null default now()
  );

  -- RLS
  alter table page_banners enable row level security;

  -- 기존 정책 삭제 후 재생성 (이미 생성한 경우)
  -- drop policy if exists "public read active" on page_banners;
  -- drop policy if exists "admin all" on page_banners;

  -- anon(비로그인) 포함 모든 사용자가 is_active=true 행을 읽을 수 있도록 to public 명시
  create policy "public read active" on page_banners
    for select
    to public                        -- anon + authenticated 모두 포함
    using (is_active = true);

  -- 관리자만 전체 CRUD
  create policy "admin all" on page_banners for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

  -- anon role에 SELECT 권한 부여 (RLS와 별도로 테이블 권한 필요)
  grant select on page_banners to anon;
  grant select on page_banners to authenticated;

  -- Storage: banner-images 버킷 생성 (public)
  insert into storage.buckets (id, name, public) values ('banner-images', 'banner-images', true);
  create policy "public read banner-images" on storage.objects for select using (bucket_id = 'banner-images');
  create policy "admin upload banner-images" on storage.objects for insert with check (
    bucket_id = 'banner-images' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
  create policy "admin delete banner-images" on storage.objects for delete using (
    bucket_id = 'banner-images' and
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

  -- 초기 데이터
  insert into page_banners (page_key, title_ko, title_en, subtitle_ko, subtitle_en) values
  ('product',     '제품소개', 'PRODUCTS',             '혁신적인 기술로 글로벌 스탠다드를 다시 씁니다.', 'Rewriting the Global Standard Through Innovative Technology.'),
  ('certificate', '특허 & 인증', 'Patents & Certifications', '엄격한 품질 관리와 글로벌 인증으로 차별화된 신뢰를 증명합니다.', 'Proven excellence through rigorous quality management and global certification.'),
  ('brochure',    '브로셔', 'BROCHURE',              '용창의 기술이 닿는 모든 곳에, 안전과 신뢰라는 가치를 심습니다.', 'Wherever Yongchang technology reaches, safety and trust take root.');
*/

export const PAGE_KEYS = [
  { key: "product",     labelKo: "제품소개 페이지",   labelEn: "Products Page" },
  { key: "certificate", labelKo: "특허·인증 페이지",  labelEn: "Certificates Page" },
  { key: "brochure",    labelKo: "브로셔 페이지",     labelEn: "Brochure Page" },
] as const;

export const pageBannerService = {
  async getBanner(pageKey: string): Promise<PageBanner | null> {
    // .maybeSingle() : 행이 0개면 null 반환(에러 없음), 실제 DB 에러만 error 객체로 옴
    // .single()은 행이 0개일 때도 PGRST116 에러를 반환해서 RLS 차단과 구별 불가
    const { data, error } = await supabase
      .from("page_banners")
      .select("*")
      .eq("page_key", pageKey)
      .eq("is_active", true)      // RLS에만 의존하지 않고 명시적으로 필터
      .maybeSingle();

    if (error) {
      // 개발 환경에서 원인을 콘솔로 확인 가능
      console.error(`[pageBannerService] getBanner("${pageKey}") 실패:`, {
        code: error.code,
        message: error.message,
        hint: error.hint,
      });
      return null;
    }

    return data as PageBanner | null;
  },

  async getAllBanners(): Promise<PageBanner[]> {
    // 관리자용 - is_active 필터 없이 전체 조회 (RLS: admin all 정책 적용)
    const { data, error } = await supabase
      .from("page_banners")
      .select("*")
      .order("page_key");
    if (error) {
      console.error("[pageBannerService] getAllBanners 실패:", error);
      throw error;
    }
    return data as PageBanner[];
  },

  async upsertBanner(pageKey: string, payload: Partial<Omit<PageBanner, "id" | "page_key" | "updated_at">>): Promise<PageBanner> {
    const { data, error } = await supabase
      .from("page_banners")
      .upsert({ page_key: pageKey, ...payload, updated_at: new Date().toISOString() }, { onConflict: "page_key" })
      .select()
      .single();
    if (error) throw error;
    return data as PageBanner;
  },

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("banner-images").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("banner-images").getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    const path = url.split("/banner-images/")[1];
    if (!path) return;
    await supabase.storage.from("banner-images").remove([path]);
  },
};
