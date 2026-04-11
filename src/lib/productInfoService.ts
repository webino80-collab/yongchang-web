import { supabase } from "./supabaseClient";
import type { Product, ProductSpecRow } from "@/types";

/*
  DB 스키마·Storage·RLS: supabase/migrations/003_site_content_tables.sql
  갤러리·확장 컬럼 한 번에: 015_products_gallery_and_admin_form_bundle.sql (또는 012 + 014)
  Storage 404/비공개 버킷 보정: 013_product_images_storage_fix.sql
  샘플 제품 시드(테이블이 비어 있을 때만): 011_products_seed.sql
  제품소개 랜딩 2×2 카드: 016_product_landing_categories.sql

  Supabase 대시보드 → SQL Editor에서 위 파일을 순서대로 실행하거나,
  로컬에서 supabase db push / link 후 마이그레이션을 적용하세요.
*/

export function normalizeGalleryUrls(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  }
  return [];
}

/** 대표 image_url + gallery_urls 를 중복 제거한 순서로 합침 (목록·상세 공통) */
export function productDisplayImages(p: Pick<Product, "image_url" | "gallery_urls">): string[] {
  const main = p.image_url?.trim() || null;
  const extra = normalizeGalleryUrls(p.gallery_urls);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of [main, ...extra]) {
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

export function productTo5Slots(p: Pick<Product, "image_url" | "gallery_urls">): [string, string, string, string, string] {
  const imgs = productDisplayImages(p);
  return [0, 1, 2, 3, 4].map((i) => imgs[i] ?? "") as [string, string, string, string, string];
}

export function slots5ToLegacy(slots: [string, string, string, string, string]) {
  const s = slots.map((x) => x.trim());
  return {
    image_url: s[0] ? s[0] : null,
    gallery_urls: s.slice(1).filter(Boolean),
  };
}

export function normalizeFeaturesTuple(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ["", "", "", "", ""];
  const a = raw.map((x) => String(x ?? ""));
  return [0, 1, 2, 3, 4].map((i) => a[i] ?? "");
}

export function normalizeSpecRows(raw: unknown): ProductSpecRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => r != null && typeof r === "object")
    .map((r) => ({
      gauge: String(r.gauge ?? ""),
      length: String(r.length ?? ""),
      color_hex: String(r.color_hex ?? r.color ?? "#cccccc"),
      wall_type: String(r.wall_type ?? ""),
      measurement: String(r.measurement ?? ""),
    }));
}

function mapProductRow(row: Product): Product {
  const r = row as unknown as Record<string, unknown>;
  return {
    ...row,
    gallery_urls: normalizeGalleryUrls(r.gallery_urls),
    subtitle_ko: (r.subtitle_ko as string) ?? null,
    subtitle_en: (r.subtitle_en as string) ?? null,
    summary_ko: (r.summary_ko as string) ?? null,
    summary_en: (r.summary_en as string) ?? null,
    features_ko: normalizeFeaturesTuple(r.features_ko),
    features_en: normalizeFeaturesTuple(r.features_en),
    detail_html_ko: (r.detail_html_ko as string) ?? null,
    detail_html_en: (r.detail_html_en as string) ?? null,
    spec_subtype: (r.spec_subtype as string) ?? null,
    spec_rows: normalizeSpecRows(r.spec_rows),
  };
}

export const PRODUCT_CATEGORIES = [
  { value: "all",        labelKo: "전체",     labelEn: "All" },
  { value: "needle",     labelKo: "니들",     labelEn: "Needle" },
  { value: "cannula",    labelKo: "캐뉼라",   labelEn: "Cannula" },
  { value: "anesthesia", labelKo: "마취",     labelEn: "Anesthesia" },
  { value: "syringe",    labelKo: "주사기",   labelEn: "Syringe" },
  { value: "other",      labelKo: "기타",     labelEn: "Other" },
] as const;

export const productInfoService = {
  async getActiveProducts(category?: string): Promise<Product[]> {
    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return ((data ?? []) as unknown as Product[]).map(mapProductRow);
  },

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw error;
    return data ? mapProductRow(data as unknown as Product) : null;
  },

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return ((data ?? []) as unknown as Product[]).map(mapProductRow);
  },

  async createProduct(payload: Omit<Product, "id" | "created_at">): Promise<Product> {
    const specRows = normalizeSpecRows(payload.spec_rows);
    const body = {
      ...payload,
      gallery_urls: normalizeGalleryUrls(payload.gallery_urls),
      features_ko: normalizeFeaturesTuple(payload.features_ko),
      features_en: normalizeFeaturesTuple(payload.features_en),
      spec_rows: specRows as unknown as Record<string, unknown>[],
    };
    const { data, error } = await supabase.from("products").insert(body).select();
    if (error) throw error;
    const row = data?.[0];
    if (!row) {
      throw new Error(
        "제품이 생성되었으나 응답 행을 받지 못했습니다. RLS 정책(관리자 SELECT) 또는 DB 트리거를 확인하세요."
      );
    }
    return mapProductRow(row as unknown as Product);
  },

  async updateProduct(id: string, payload: Partial<Omit<Product, "id" | "created_at">>): Promise<Product> {
    const body: Record<string, unknown> = { ...payload };
    if (payload.gallery_urls !== undefined) {
      body.gallery_urls = normalizeGalleryUrls(payload.gallery_urls);
    }
    if (payload.features_ko !== undefined) {
      body.features_ko = normalizeFeaturesTuple(payload.features_ko);
    }
    if (payload.features_en !== undefined) {
      body.features_en = normalizeFeaturesTuple(payload.features_en);
    }
    if (payload.spec_rows !== undefined) {
      body.spec_rows = normalizeSpecRows(payload.spec_rows) as unknown as Record<string, unknown>[];
    }
    const { data, error } = await supabase.from("products").update(body as never).eq("id", id).select();
    if (error) throw error;
    const row = data?.[0];
    if (!row) {
      throw new Error(
        "저장된 행이 없습니다. id가 올바른지, 관리자 권한(RLS)으로 해당 제품을 수정·조회할 수 있는지 확인하세요."
      );
    }
    return mapProductRow(row as unknown as Product);
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadImage(file: File): Promise<string> {
    const rawExt = file.name.includes(".") ? file.name.split(".").pop() : "";
    const ext = (rawExt && /^[a-zA-Z0-9]+$/.test(rawExt) ? rawExt : "jpg").toLowerCase();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteImage(url: string): Promise<void> {
    const path = url.split("/product-images/")[1];
    if (!path) return;
    await supabase.storage.from("product-images").remove([path]);
  },

  async reorderProducts(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, idx) =>
        supabase.from("products").update({ sort_order: idx + 1 }).eq("id", id)
      )
    );
  },
};
