import { supabase } from "./supabaseClient";
import type { ProductCategory } from "@/types";
import { PRODUCT_CATEGORIES } from "./productInfoService";

/** DB 없음·오류 시 `productInfoService.PRODUCT_CATEGORIES` 기준 폴백 */
export function staticFallbackProductCategories(): ProductCategory[] {
  let order = 0;
  return PRODUCT_CATEGORIES.filter((c) => c.value !== "all").map((c) => ({
    slug: c.value,
    label_ko: c.labelKo,
    label_en: c.labelEn,
    sort_order: ++order,
    is_active: true,
    updated_at: new Date().toISOString(),
  }));
}

export function headlineForSlug(slug: string, lang: string, cats: ProductCategory[]): string {
  const r = cats.find((c) => c.slug === slug);
  if (r) return lang === "ko" ? r.label_ko : r.label_en;
  return slug.toUpperCase();
}

export const productCategoryService = {
  /** 공개(헤더·브라우즈·상세) — 활성만, sort_order */
  async getActive(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[productCategoryService] getActive:", error);
      return staticFallbackProductCategories();
    }
    if (!data?.length) return staticFallbackProductCategories();
    return data as ProductCategory[];
  },

  /** 관리자 — 비활성 포함(빈 테이블이면 빈 배열) */
  async getAllForAdmin(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from("product_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[productCategoryService] getAllForAdmin:", error);
      return [];
    }
    return (data ?? []) as ProductCategory[];
  },

  async upsertMany(rows: ProductCategory[]): Promise<void> {
    const payload = rows.map((r) => ({
      slug: r.slug.trim(),
      label_ko: r.label_ko.trim(),
      label_en: r.label_en.trim(),
      sort_order: r.sort_order,
      is_active: r.is_active,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("product_categories").upsert(payload, { onConflict: "slug" });
    if (error) throw error;
  },
};
