import { supabase } from "./supabaseClient";
import type { HomeRollingSlide } from "@/types";

const TABLE = "home_rolling_slides";
const BUCKET = "hero-images";

export const homeRollingService = {
  /** 활성 슬라이드 최대 3개 (sort_order 오름차순) */
  async getActiveSlides(): Promise<HomeRollingSlide[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(3);
    if (error) throw error;
    return (data as HomeRollingSlide[]) ?? [];
  },

  async getAllSlides(): Promise<HomeRollingSlide[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data as HomeRollingSlide[]) ?? [];
  },

  async createSlide(input: {
    image_url: string;
    image_url_en?: string | null;
    sort_order?: number;
  }): Promise<HomeRollingSlide> {
    const en = input.image_url_en?.trim() || null;
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        image_url: input.image_url,
        image_url_en: en,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as HomeRollingSlide;
  },

  async updateSlide(
    id: string,
    input: Partial<Pick<HomeRollingSlide, "image_url" | "image_url_en" | "sort_order" | "is_active">>
  ): Promise<HomeRollingSlide> {
    const { data, error } = await supabase.from(TABLE).update(input).eq("id", id).select().single();
    if (error) throw error;
    return data as HomeRollingSlide;
  },

  async deleteSlide(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  async uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `rolling/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    try {
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.indexOf(marker);
      if (idx === -1) return;
      const path = url.slice(idx + marker.length);
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {
      /* ignore */
    }
  },

  async reorderSlides(updates: { id: string; sort_order: number }[]): Promise<void> {
    await Promise.all(
      updates.map(({ id, sort_order }) => supabase.from(TABLE).update({ sort_order }).eq("id", id))
    );
  },
};
