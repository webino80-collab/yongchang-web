/**
 * visualService — hero_slides 테이블 CRUD + Supabase Storage 이미지 업로드
 *
 * ★ Supabase에서 아래 SQL을 먼저 실행하세요:
 *
 * create table public.hero_slides (
 *   id          uuid primary key default gen_random_uuid(),
 *   image_url   text not null,
 *   main_text   text not null,
 *   main_text_en text,
 *   sub_text    text,
 *   sub_text_en text,
 *   sort_order  int  not null default 0,
 *   is_active   boolean not null default true,
 *   created_at  timestamptz not null default now()
 * );
 * alter table public.hero_slides enable row level security;
 *
 * -- 누구나 활성 슬라이드 읽기 가능
 * create policy "public_read_active" on public.hero_slides
 *   for select using (is_active = true);
 *
 * -- 관리자만 전체 접근
 * create policy "admin_all" on public.hero_slides
 *   for all using (
 *     exists (
 *       select 1 from public.profiles
 *       where profiles.id = auth.uid() and profiles.is_admin = true
 *     )
 *   );
 *
 * ★ Supabase Storage에서 "hero-images" 버킷을 Public으로 생성하세요.
 *   Storage → New bucket → Name: hero-images → Public: ON
 *
 * 메인 히어로 아래 롤링 이미지: supabase/migrations/017_home_rolling_slides.sql + homeRollingService.ts
 */

import { supabase } from "./supabaseClient";
import type { HeroSlide } from "@/types";

const TABLE = "hero_slides";
const BUCKET = "hero-images";

export const visualService = {
  /** 공개: 활성 슬라이드만 sort_order 순서로 반환 */
  async getActiveSlides(): Promise<HeroSlide[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as HeroSlide[]) ?? [];
  },

  /** 관리자: 전체 슬라이드 반환 */
  async getAllSlides(): Promise<HeroSlide[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as HeroSlide[]) ?? [];
  },

  /** 슬라이드 생성 */
  async createSlide(input: {
    image_url: string;
    main_text: string;
    main_text_en?: string | null;
    sub_text?: string | null;
    sub_text_en?: string | null;
    sort_order?: number;
  }): Promise<HeroSlide> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data as HeroSlide;
  },

  /** 슬라이드 수정 */
  async updateSlide(id: string, input: Partial<Omit<HeroSlide, "id" | "created_at">>): Promise<HeroSlide> {
    const { data, error } = await supabase
      .from(TABLE)
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as HeroSlide;
  },

  /** 슬라이드 삭제 */
  async deleteSlide(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  /** 이미지 파일을 Supabase Storage에 업로드하고 Public URL 반환 */
  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  /** Storage에서 이미지 삭제 (URL에서 path 추출) */
  async deleteImage(url: string): Promise<void> {
    try {
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      const path = url.slice(idx + marker.length);
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {
      // 이미지 삭제 실패는 무시 (슬라이드 데이터는 이미 삭제됨)
    }
  },

  /** 여러 슬라이드의 sort_order 일괄 업데이트 */
  async reorderSlides(updates: { id: string; sort_order: number }[]): Promise<void> {
    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from(TABLE).update({ sort_order }).eq("id", id)
      )
    );
  },
};
