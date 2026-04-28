import { supabase } from "./supabaseClient";
import type { ProductLandingCategory } from "@/types";

export const PRODUCT_LANDING_CATEGORY_KEYS = [
  "needle",
  "cannula",
  "anesthesia",
  "syringe",
] as const;

export type ProductLandingCategoryKey = (typeof PRODUCT_LANDING_CATEGORY_KEYS)[number];

export const productLandingService = {
  async getActive(): Promise<ProductLandingCategory[]> {
    const { data, error } = await supabase
      .from("product_landing_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ProductLandingCategory[];
  },

  async getAllForAdmin(): Promise<ProductLandingCategory[]> {
    const { data, error } = await supabase
      .from("product_landing_categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as ProductLandingCategory[];
  },

  async upsertCategory(row: Omit<ProductLandingCategory, "updated_at">): Promise<void> {
    const { error } = await supabase.from("product_landing_categories").upsert(
      {
        ...row,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "category" }
    );
    if (error) throw error;
  },
};
