import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  productLandingService,
  PRODUCT_LANDING_CATEGORY_KEYS,
  type ProductLandingCategoryKey,
} from "@/lib/productLandingService";
import { productInfoService } from "@/lib/productInfoService";
import { PageSpinner } from "@/components/ui/Spinner";
import type { ProductLandingCategory } from "@/types";

const CATEGORY_LABEL_KO: Record<ProductLandingCategoryKey, string> = {
  needle: "니들",
  cannula: "캐뉼라",
  anesthesia: "마취용 침",
  syringe: "주사기",
};

const SEED_DEFAULTS: Record<
  ProductLandingCategoryKey,
  Omit<ProductLandingCategory, "category" | "updated_at">
> = {
  needle: {
    title_ko: "NEEDLE",
    title_en: "NEEDLE",
    desc_ko: "멸균주사침, 메조니들, 펜니들, 비이식형 혈관접속용 기구.",
    desc_en:
      "Sterile syringe needles, meso needles, pen needles, and non-implantable vascular access devices.",
    image_url: null,
    sort_order: 1,
    is_active: true,
  },
  cannula: {
    title_ko: "캐뉼라",
    title_en: "CANNULA",
    desc_ko: "캐뉼라, 필러캐뉼라, OSG 캐뉼라.",
    desc_en: "Cannula, filler cannula, OSG cannula.",
    image_url: null,
    sort_order: 2,
    is_active: true,
  },
  anesthesia: {
    title_ko: "마취용 침",
    title_en: "ANESTHESIA NEEDLE",
    desc_ko: "경막외투여용침, 척추마취용침.",
    desc_en: "Epidural and spinal anesthesia needles.",
    image_url: null,
    sort_order: 3,
    is_active: true,
  },
  syringe: {
    title_ko: "주사기",
    title_en: "SYRINGE",
    desc_ko: "주사기, 인슐린 주사기.",
    desc_en: "Syringes and insulin syringes.",
    image_url: null,
    sort_order: 4,
    is_active: true,
  },
};

type FormState = Omit<ProductLandingCategory, "updated_at">;

function rowForCategory(
  cat: ProductLandingCategoryKey,
  rows: ProductLandingCategory[]
): FormState {
  const found = rows.find((r) => r.category === cat);
  if (found) {
    return {
      category: found.category,
      title_ko: found.title_ko,
      title_en: found.title_en,
      desc_ko: found.desc_ko,
      desc_en: found.desc_en,
      image_url: found.image_url,
      sort_order: found.sort_order,
      is_active: found.is_active,
    };
  }
  return { category: cat, ...SEED_DEFAULTS[cat] };
}

export function ProductLandingAdminPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editCategory, setEditCategory] = useState<ProductLandingCategoryKey | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-product-landing-categories"],
    queryFn: () => productLandingService.getAllForAdmin(),
  });

  const mergedList = useMemo(
    () => PRODUCT_LANDING_CATEGORY_KEYS.map((k) => rowForCategory(k, rows)),
    [rows]
  );

  const upsert = useMutation({
    mutationFn: (payload: FormState) => productLandingService.upsertCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-landing-categories"] });
      queryClient.invalidateQueries({ queryKey: ["product-landing-categories"] });
      setEditCategory(null);
      setForm(null);
    },
  });

  function startEdit(cat: ProductLandingCategoryKey) {
    setEditCategory(cat);
    setForm(rowForCategory(cat, rows));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await productInfoService.uploadImage(file);
      setForm((p) => (p ? { ...p, image_url: url } : p));
    } catch {
      alert("이미지 업로드에 실패했습니다. (product-images 버킷·RLS 확인)");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    upsert.mutate(form);
  }

  const getRow = (cat: ProductLandingCategoryKey) => rows.find((r) => r.category === cat);

  if (isLoading && !rows.length) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">제품소개 랜딩 카드</h1>
        <p className="text-sm text-gray-500 mt-1">
          <code>/board/product</code> 첫 화면 2×2 카드별 이미지·제목·설명을 관리합니다. 분류(카테고리)는 고정 4종이며
          브라우징 필터와 동일한 키입니다.
        </p>
      </div>

      {!rows.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">DB에 행이 없습니다</p>
          <p>
            Supabase에 마이그레이션 <code>016_product_landing_categories.sql</code>을 적용하면 시드 4행이 들어갑니다.
            아래에서 바로 저장하면 해당 카테고리 행이 생성됩니다.
          </p>
        </div>
      )}

      {editCategory && form && (
        <div className="card p-6 mb-6 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {CATEGORY_LABEL_KO[editCategory]} ({editCategory}) 카드 수정
            </h2>
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-gray-700"
              onClick={() => {
                setEditCategory(null);
                setForm(null);
              }}
            >
              ✕ 닫기
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카드 이미지</label>
              <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                랜딩 카드는 4:3 비율로 표시됩니다. 권장: 1200×900px 이상, Retina·고해상도 대비 1600×1200px. 형식:
                JPG·PNG·WebP.
              </p>
              <div className="flex gap-3 items-start flex-wrap">
                <input
                  className="input flex-1 min-w-[200px]"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm((p) => (p ? { ...p, image_url: e.target.value || null } : p))}
                  placeholder="https://... 또는 파일 업로드"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm shrink-0"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "업로드 중..." : "파일 선택"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              {form.image_url && (
                <div className="mt-2 relative rounded-lg overflow-hidden max-w-md" style={{ height: "12rem" }}>
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 (국문)</label>
                <input
                  className="input w-full"
                  value={form.title_ko}
                  onChange={(e) => setForm((p) => (p ? { ...p, title_ko: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 (영문)</label>
                <input
                  className="input w-full"
                  value={form.title_en}
                  onChange={(e) => setForm((p) => (p ? { ...p, title_en: e.target.value } : p))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (국문)</label>
                <textarea
                  className="input w-full min-h-[88px]"
                  value={form.desc_ko}
                  onChange={(e) => setForm((p) => (p ? { ...p, desc_ko: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (영문)</label>
                <textarea
                  className="input w-full min-h-[88px]"
                  value={form.desc_en}
                  onChange={(e) => setForm((p) => (p ? { ...p, desc_en: e.target.value } : p))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">정렬 순서</label>
                <input
                  type="number"
                  className="input w-full"
                  min={1}
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((p) =>
                      p ? { ...p, sort_order: Number.parseInt(e.target.value, 10) || 1 } : p
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => (p ? { ...p, is_active: e.target.checked } : p))}
                  className="rounded"
                />
                공개(비활성 시 사이트 랜딩에서 숨김, 코드 폴백 문구 사용)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={upsert.isPending}>
                {upsert.isPending ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditCategory(null);
                  setForm(null);
                }}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {mergedList.map((row) => {
          const cat = row.category as ProductLandingCategoryKey;
          const dbRow = getRow(cat);
          return (
            <div key={cat} className="card overflow-hidden">
              <div className="flex items-stretch">
                <div
                  className="shrink-0 hidden sm:block bg-gray-200"
                  style={{ width: 200, aspectRatio: "4/3", position: "relative" }}
                >
                  {dbRow?.image_url ? (
                    <img
                      src={dbRow.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="flex-1 p-4 flex items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-gray-800">{CATEGORY_LABEL_KO[cat]}</span>
                      <code className="text-xs bg-gray-100 px-1 rounded">{cat}</code>
                      {dbRow ? (
                        <span className={`badge ${dbRow.is_active ? "badge-green" : "badge-red"} text-xs`}>
                          {dbRow.is_active ? "공개" : "숨김"}
                        </span>
                      ) : (
                        <span className="badge badge-gray text-xs">미저장</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{row.title_ko}</p>
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm shrink-0" onClick={() => startEdit(cat)}>
                    수정
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
