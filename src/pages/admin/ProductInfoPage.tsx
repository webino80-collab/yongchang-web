import { useState, useRef, useEffect, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productInfoService,
  productDisplayImages,
  productTo5Slots,
  slots5ToLegacy,
  normalizeFeaturesTuple,
} from "@/lib/productInfoService";
import { productCategoryService, headlineForSlug, staticFallbackProductCategories } from "@/lib/productCategoryService";
import { normalizeSpecSubtype } from "@/lib/productSpecLayouts";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Product } from "@/types";
import { emptySpecRow, fileLabelFromUrl } from "@/pages/admin/productAdminConstants";
import { ProductSpecSection, type ProductForm } from "@/components/admin/ProductSpecSection";

function formatSupabaseError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const o = err as { message?: string; details?: string; hint?: string; code?: string };
    return [o.message, o.details, o.hint ? `hint: ${o.hint}` : "", o.code ? `code: ${o.code}` : ""]
      .filter(Boolean)
      .join("\n");
  }
  return String(err ?? "알 수 없는 오류");
}

/** 네트워크 탭 4xx 시 사용자가 바로 조치할 수 있도록 안내 */
function saveFailureHint(detail: string): string | null {
  const t = detail.toLowerCase();
  if (
    t.includes("could not find") ||
    t.includes("pgrst204") ||
    (t.includes("column") && t.includes("schema"))
  ) {
    return "원격 DB에 컬럼이 아직 없을 때 납니다. Supabase → SQL Editor에서 supabase/migrations/015_products_gallery_and_admin_form_bundle.sql(또는 012→014) 및 상세 이미지용 024_products_detail_image_urls.sql을 실행했는지 확인하세요.";
  }
  if (
    t.includes("permission denied") ||
    t.includes("42501") ||
    t.includes("row-level security") ||
    t.includes("rls") ||
    t.includes("new row violates")
  ) {
    return "관리자만 저장할 수 있습니다. profiles에서 해당 계정의 is_admin이 true인지, 또는 JWT app_metadata.is_admin이 true인지 확인하세요. (004_admin_rls_jwt_and_brochure_fix.sql 적용 여부)";
  }
  if (t.includes("jwt") || t.includes("not authenticated") || t.includes("401")) {
    return "로그인이 풀렸을 수 있습니다. 관리자 페이지에서 다시 로그인한 뒤 시도해 주세요.";
  }
  return null;
}

const FE0: [string, string, string, string, string] = ["", "", "", "", ""];

const EMPTY_FORM: ProductForm = {
  title_ko: "",
  title_en: "",
  desc_ko: "",
  desc_en: "",
  image_url: "",
  gallery_urls: [],
  category: "needle",
  sort_order: 0,
  is_active: true,
  subtitle_ko: null,
  subtitle_en: null,
  summary_ko: null,
  summary_en: null,
  features_ko: [...FE0],
  features_en: [...FE0],
  detail_html_ko: null,
  detail_html_en: null,
  detail_image_url_ko: "",
  detail_image_url_en: "",
  spec_subtype: "gcl",
  spec_rows: [],
  spec_gcc_plus_intro_ko: null,
  spec_gcc_plus_intro_en: null,
  spec_gcc_plus_tables: null,
};

function formFromProduct(p: Product): ProductForm {
  return {
    title_ko: p.title_ko,
    title_en: p.title_en,
    desc_ko: p.desc_ko ?? "",
    desc_en: p.desc_en ?? "",
    image_url: p.image_url ?? "",
    gallery_urls: [...p.gallery_urls],
    category: p.category,
    sort_order: p.sort_order,
    is_active: p.is_active,
    subtitle_ko: p.subtitle_ko ?? "",
    subtitle_en: p.subtitle_en ?? "",
    summary_ko: p.summary_ko ?? p.desc_ko ?? "",
    summary_en: p.summary_en ?? p.desc_en ?? "",
    features_ko: [...p.features_ko],
    features_en: [...p.features_en],
    detail_html_ko: null,
    detail_html_en: null,
    detail_image_url_ko:
      p.detail_image_url_ko?.trim() || extractDetailImageFromLegacy(p.detail_html_ko) || "",
    detail_image_url_en:
      p.detail_image_url_en?.trim() || extractDetailImageFromLegacy(p.detail_html_en) || "",
    spec_subtype: p.spec_subtype ?? "gcl",
    spec_rows: p.spec_rows.length ? p.spec_rows.map((r) => ({ ...r })) : [],
    spec_gcc_plus_intro_ko: p.spec_gcc_plus_intro_ko ?? null,
    spec_gcc_plus_intro_en: p.spec_gcc_plus_intro_en ?? null,
    spec_gcc_plus_tables: p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables.map((t) => ({ ...t, rows: t.rows.map((r) => ({ ...r })) })) : null,
  };
}

function RemoteImagePreview({ url, className }: { url: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const u = url.trim();
  useEffect(() => {
    setFailed(false);
  }, [u]);
  if (!u || !/^https?:\/\//i.test(u)) return null;
  if (failed) {
    return <p className="text-[11px] text-red-600 leading-tight max-w-[5.5rem]">로드 실패</p>;
  }
  return <img src={u} alt="" className={className} onError={() => setFailed(true)} />;
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 mb-5">
      <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">{title}</h3>
      {children}
    </section>
  );
}

/** 기존 detail_html(단일 URL 또는 첫 img)에서 상세 이미지 URL 추출 */
function extractDetailImageFromLegacy(htmlOrUrl: string | null | undefined): string {
  const s = String(htmlOrUrl ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s) && !/[<>]/.test(s)) return s;
  const m = s.match(/<img[^>]+src=["']([^"']+)["']/i);
  return (m?.[1] ?? "").trim();
}

type DetailLang = "ko" | "en";

export function ProductInfoPage() {
  const queryClient = useQueryClient();
  const slotFileRef = useRef<HTMLInputElement>(null);
  const pendingSlotIndex = useRef<number>(0);
  const detailImageInputRef = useRef<HTMLInputElement>(null);
  const pendingDetailImageLang = useRef<DetailLang>("ko");

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [detailImgUploading, setDetailImgUploading] = useState<null | DetailLang>(null);
  const [showForm, setShowForm] = useState(false);
  const [specSelected, setSpecSelected] = useState<Set<number>>(new Set());

  const { data: products = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => productInfoService.getAllProducts(),
  });

  const { data: categoryRows = [] } = useQuery({
    queryKey: ["product-categories-admin"],
    queryFn: () => productCategoryService.getAllForAdmin(),
  });

  const categoryMetaList = useMemo(
    () => (categoryRows.length ? categoryRows : staticFallbackProductCategories()),
    [categoryRows]
  );

  const categoryOptionsForSelect = useMemo(
    () => categoryMetaList.filter((r) => r.is_active || r.slug === form.category),
    [categoryMetaList, form.category]
  );

  const loadErrorMessage = isError
    ? error instanceof Error
      ? error.message
      : String(error)
    : "";

  const create = useMutation({
    mutationFn: (payload: ProductForm) => productInfoService.createProduct(toPayload(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      resetForm();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductForm }) =>
      productInfoService.updateProduct(id, toPayload(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      resetForm();
    },
  });

  function toPayload(f: ProductForm): Omit<Product, "id" | "created_at"> {
    const sumKo = String(f.summary_ko ?? "").trim();
    const sumEn = String(f.summary_en ?? "").trim();
    return {
      ...f,
      image_url: String(f.image_url ?? "").trim() || null,
      gallery_urls: f.gallery_urls.map((s) => s.trim()).filter(Boolean),
      subtitle_ko: String(f.subtitle_ko ?? "").trim() || null,
      subtitle_en: String(f.subtitle_en ?? "").trim() || null,
      summary_ko: sumKo || null,
      summary_en: sumEn || null,
      desc_ko: sumKo || String(f.desc_ko ?? "").trim() || null,
      desc_en: sumEn || String(f.desc_en ?? "").trim() || null,
      features_ko: normalizeFeaturesTuple(f.features_ko),
      features_en: normalizeFeaturesTuple(f.features_en),
      detail_image_url_ko: String(f.detail_image_url_ko ?? "").trim() || null,
      detail_image_url_en: String(f.detail_image_url_en ?? "").trim() || null,
      detail_html_ko: null,
      detail_html_en: null,
      spec_subtype: normalizeSpecSubtype(f.spec_subtype),
      spec_rows: f.spec_rows,
    };
  }

  const remove = useMutation({
    mutationFn: (id: string) => productInfoService.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      productInfoService.updateProduct(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const moveUp = useMutation({
    mutationFn: async (idx: number) => {
      if (!products || idx === 0) return;
      const ids = products.map((p) => p.id);
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      await productInfoService.reorderProducts(ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const moveDown = useMutation({
    mutationFn: async (idx: number) => {
      if (!products || idx === products.length - 1) return;
      const ids = products.map((p) => p.id);
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      await productInfoService.reorderProducts(ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  function resetForm() {
    create.reset();
    update.reset();
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    setSpecSelected(new Set());
  }

  function startEdit(p: Product) {
    setForm(formFromProduct(p));
    setEditId(p.id);
    setShowForm(true);
    setSpecSelected(new Set());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function patchImageSlot(slotIndex: number, url: string) {
    const slots = productTo5Slots({ image_url: form.image_url, gallery_urls: form.gallery_urls });
    const next = [...slots] as [string, string, string, string, string];
    next[slotIndex] = url;
    const { image_url, gallery_urls } = slots5ToLegacy(next);
    setForm((f) => ({ ...f, image_url: image_url ?? "", gallery_urls }));
  }

  async function handleSlotFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const idx = pendingSlotIndex.current;
    setUploading(true);
    try {
      const url = await productInfoService.uploadImage(file);
      patchImageSlot(idx, url);
    } catch (err) {
      console.error(err);
      alert(`이미지 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function openDetailImagePicker(lang: DetailLang) {
    pendingDetailImageLang.current = lang;
    detailImageInputRef.current?.click();
  }

  async function handleDetailImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const lang = pendingDetailImageLang.current;
    e.target.value = "";
    if (!file) return;
    setDetailImgUploading(lang);
    try {
      const url = await productInfoService.uploadImage(file);
      const key = lang === "ko" ? "detail_image_url_ko" : "detail_image_url_en";
      setForm((f) => ({ ...f, [key]: url }));
    } catch (err) {
      console.error(err);
      alert(`상세 이미지 업로드 실패: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDetailImgUploading(null);
    }
  }

  function clearDetailImage(lang: DetailLang) {
    const key = lang === "ko" ? "detail_image_url_ko" : "detail_image_url_en";
    setForm((f) => ({ ...f, [key]: "" }));
  }

  function openSlotPicker(i: number) {
    pendingSlotIndex.current = i;
    slotFileRef.current?.click();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    create.reset();
    update.reset();
    if (!form.title_ko.trim()) {
      alert("제품명(국문)을 입력해주세요.");
      return;
    }
    if (!form.title_en.trim()) {
      alert("제품명(영문)을 입력해주세요.");
      return;
    }
    const payload = { ...form };
    if (editId) {
      update.mutate({ id: editId, payload });
    } else {
      create.mutate({ ...payload, sort_order: (products?.length ?? 0) + 1 });
    }
  }

  function toggleSpecRow(i: number) {
    setSpecSelected((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function addSpecRows() {
    setForm((f) => ({ ...f, spec_rows: [...f.spec_rows, emptySpecRow()] }));
  }

  function deleteSelectedSpecRows() {
    setForm((f) => ({
      ...f,
      spec_rows: f.spec_rows.filter((_, i) => !specSelected.has(i)),
    }));
    setSpecSelected(new Set());
  }

  function updateSpecRow(i: number, patch: Partial<Product["spec_rows"][number]>) {
    setForm((f) => ({
      ...f,
      spec_rows: f.spec_rows.map((row, j) => (j === i ? { ...row, ...patch } : row)),
    }));
  }

  const slots = productTo5Slots({ image_url: form.image_url, gallery_urls: form.gallery_urls });
  const saving = create.isPending || update.isPending;
  const saveErrorText =
    create.isError || update.isError ? formatSupabaseError(create.error ?? update.error) : "";
  const saveErrorHint = saveErrorText ? saveFailureHint(saveErrorText) : null;
  if (isLoading && !products.length) return <PageSpinner />;

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제품소개 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            제품 분류(메뉴·필터 표시명)는{" "}
            <Link to="/admin/product-categories" className="text-[#0f2d52] font-medium underline-offset-2 hover:underline">
              제품 분류
            </Link>
            에서 수정합니다.
          </p>
        </div>
        {!showForm && (
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={() => setShowForm(true)}>
            + 제품 추가
          </button>
        )}
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
          <p className="font-semibold mb-1">데이터를 불러오지 못했습니다</p>
          <p className="mb-2 font-mono text-xs break-all opacity-90">{loadErrorMessage}</p>
          <p>
            <code className="bg-red-100 px-1 rounded">003_site_content_tables.sql</code> 후 제품 저장 오류면{" "}
            <code className="bg-red-100 px-1 rounded">015_products_gallery_and_admin_form_bundle.sql</code> 한 번 실행
            (또는 <code className="bg-red-100 px-1 rounded">012</code> →{" "}
            <code className="bg-red-100 px-1 rounded">014</code>).
          </p>
        </div>
      )}

      {!isError && !products?.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <p className="font-semibold mb-1">등록된 제품이 없습니다</p>
          <p className="mb-2">
            <strong>+ 제품 추가</strong> 또는 <code className="bg-amber-100 px-1 rounded">011_products_seed.sql</code>
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {editId ? "제품소개 글수정" : "제품소개 등록"}
            </h2>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                취소
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? "저장 중…" : "저장하기"}
              </button>
            </div>
          </div>

          {(create.isError || update.isError) && saveErrorText && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-900">
              <p className="font-semibold mb-1">저장에 실패했습니다</p>
              <pre className="font-mono text-xs whitespace-pre-wrap break-all opacity-95">{saveErrorText}</pre>
              {saveErrorHint && <p className="mt-3 text-red-800 leading-relaxed">{saveErrorHint}</p>}
            </div>
          )}

          <FormSection title="기본 정보">
              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-4 gap-y-3 items-center mb-4">
                <label className="text-sm font-medium text-gray-700">카테고리</label>
                <select
                  className="input w-full max-w-md"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {categoryOptionsForSelect.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label_ko} ({c.label_en})
                      {!c.is_active ? " · 비활성" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950/90 leading-relaxed">
                <p className="font-medium text-amber-900 mb-1">이미지 권장 해상도 (상세 갤러리·썸네일)</p>
                <p>
                  사용자 화면에서는 <strong>정사각(1:1)</strong> 영역에 맞춰 크게 보이고, 하단 썸네일은 같은 원본을 작게 줄여 씁니다. 흐릿함을 줄이려면{" "}
                  <strong>최소 1000×1000px</strong>, <strong>권장 1200×1200px 이상</strong>(PNG·JPG·WEBP 등)으로 올려 주세요. 가로·세로 비율이 1:1에 가까울수록 잘림이 적습니다.
                </p>
              </div>
              <input
                ref={slotFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSlotFile}
              />
              <div className="space-y-4 mb-6">
                {[0, 1, 2, 3, 4].map((i) => {
                  const url = slots[i];
                  const label = `제품 이미지 #${i + 1}${i === 0 ? " (대표·목록 썸네일)" : ""}`;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-1 md:grid-cols-[140px_1fr_auto] gap-3 items-start border border-gray-100 rounded-lg p-3 bg-gray-50/50"
                    >
                      <span className="text-sm font-medium text-gray-700 pt-2">{label}</span>
                      <div className="min-w-0 space-y-2">
                        <input
                          className="input w-full text-sm"
                          value={url}
                          onChange={(e) => patchImageSlot(i, e.target.value)}
                          placeholder="https://..."
                        />
                        {url.trim() && (
                          <p className="text-xs text-gray-500 truncate">
                            {fileLabelFromUrl(url)}
                            <button
                              type="button"
                              className="ml-2 text-red-600 hover:underline"
                              onClick={() => patchImageSlot(i, "")}
                            >
                              삭제
                            </button>
                          </p>
                        )}
                        <div className="flex h-16 w-16 items-center justify-center rounded border border-gray-200 bg-white">
                          <RemoteImagePreview url={url} className="max-h-14 max-w-14 object-contain" />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm shrink-0"
                        onClick={() => openSlotPicker(i)}
                        disabled={uploading}
                      >
                        파일 선택
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명 (국문) *</label>
                  <input
                    className="input w-full"
                    value={form.title_ko}
                    onChange={(e) => setForm((p) => ({ ...p, title_ko: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품명 (영문) *</label>
                  <input
                    className="input w-full"
                    value={form.title_en}
                    onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-4 gap-y-3 items-center mb-4">
                <label className="text-sm font-medium text-gray-700">출력 순서</label>
                <input
                  type="number"
                  className="input w-full max-w-xs"
                  value={form.sort_order}
                  onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                  min={0}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 기본설명 (국문)</label>
                  <textarea
                    className="input w-full h-20 resize-y"
                    value={form.summary_ko ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, summary_ko: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제품 기본설명 (영문)</label>
                  <textarea
                    className="input w-full h-20 resize-y"
                    value={form.summary_en ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, summary_en: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">서브 타이틀 (국문)</label>
                  <input
                    className="input w-full"
                    value={form.subtitle_ko ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, subtitle_ko: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">서브 타이틀 (영문)</label>
                  <input
                    className="input w-full"
                    value={form.subtitle_en ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, subtitle_en: e.target.value }))}
                  />
                </div>
              </div>

              <p className="text-sm font-medium text-gray-800 mb-2">특징 #1 ~ #5</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded border border-gray-100 p-3 bg-gray-50/30">
                    <label className="text-xs font-medium text-gray-600">특징 #{i + 1}</label>
                    <input
                      className="input w-full mt-1 text-sm"
                      value={form.features_ko[i]}
                      onChange={(e) =>
                        setForm((f) => {
                          const next = [...f.features_ko];
                          next[i] = e.target.value;
                          return { ...f, features_ko: next };
                        })
                      }
                      placeholder="한국어"
                    />
                    <input
                      className="input w-full mt-2 text-sm"
                      value={form.features_en[i]}
                      onChange={(e) =>
                        setForm((f) => {
                          const next = [...f.features_en];
                          next[i] = e.target.value;
                          return { ...f, features_en: next };
                        })
                      }
                      placeholder="English"
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded"
                />
                활성화 (사이트에 노출)
              </label>
          </FormSection>

          <FormSection title="상세이미지등록">
              <input
                ref={detailImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDetailImageFile}
              />
              <p className="text-xs text-gray-500 mb-4">
                제품 문의 버튼 아래·규격 표 위에 노출됩니다. 사이트 언어에 따라 국문 또는 영문 이미지가 보입니다. 가로{" "}
                <strong>1200px 이하</strong> PNG·JPG를 권장합니다.
              </p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <p className="text-sm font-medium text-gray-800 mb-3">국문 이미지</p>
                  <div className="mb-3 flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-3">
                    {form.detail_image_url_ko?.trim() ? (
                      <RemoteImagePreview
                        url={form.detail_image_url_ko}
                        className="max-h-56 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">등록된 이미지 없음</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={detailImgUploading !== null || uploading}
                      onClick={() => openDetailImagePicker("ko")}
                    >
                      {detailImgUploading === "ko" ? "업로드 중…" : "이미지 올리기"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-gray-600"
                      disabled={!form.detail_image_url_ko?.trim()}
                      onClick={() => clearDetailImage("ko")}
                    >
                      제거
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <p className="text-sm font-medium text-gray-800 mb-3">영문 이미지</p>
                  <div className="mb-3 flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-3">
                    {form.detail_image_url_en?.trim() ? (
                      <RemoteImagePreview
                        url={form.detail_image_url_en}
                        className="max-h-56 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">등록된 이미지 없음</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={detailImgUploading !== null || uploading}
                      onClick={() => openDetailImagePicker("en")}
                    >
                      {detailImgUploading === "en" ? "업로드 중…" : "이미지 올리기"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-gray-600"
                      disabled={!form.detail_image_url_en?.trim()}
                      onClick={() => clearDetailImage("en")}
                    >
                      제거
                    </button>
                  </div>
                </div>
              </div>
          </FormSection>

          <FormSection title="규격 정보">
            <ProductSpecSection
              form={form}
              setForm={setForm}
              specSelected={specSelected}
              toggleSpecRow={toggleSpecRow}
              addSpecRows={addSpecRows}
              deleteSelectedSpecRows={deleteSelectedSpecRows}
              updateSpecRow={updateSpecRow}
            />
          </FormSection>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
              취소
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">제품명</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden md:table-cell">카테고리</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">상태</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">순서</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p, idx) => {
              const thumb = productDisplayImages(p)[0];
              return (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p.title_ko}
                          className="w-10 h-10 object-contain rounded border border-gray-200 bg-gray-50 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-xs">
                          NO
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{p.title_ko}</p>
                        <p className="text-xs text-gray-400">{p.title_en}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="badge badge-blue text-xs">
                      {headlineForSlug(p.category, "ko", categoryMetaList)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}
                      className={`badge ${p.is_active ? "badge-green" : "badge-red"} cursor-pointer`}
                    >
                      {p.is_active ? "활성" : "비활성"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveUp.mutate(idx)}
                        disabled={idx === 0 || moveUp.isPending}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown.mutate(idx)}
                        disabled={idx === (products?.length ?? 0) - 1 || moveDown.isPending}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${p.title_ko}" 제품을 삭제하시겠습니까?`)) remove.mutate(p.id);
                        }}
                        className="text-xs text-red-500 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!products?.length && (
          <div className="py-16 text-center text-gray-400">등록된 제품이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
