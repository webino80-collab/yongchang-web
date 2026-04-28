import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/lib/productService";
import { PageSpinner } from "@/components/ui/Spinner";
import { clsx } from "clsx";
import type { HomeProduct } from "@/types";

const QUERY_KEY = ["admin-home-products"];

/* 기본 이미지 경로 (Supabase 이미지 없을 때 표시용) */
const defaultImgSrc = (sortOrder: number) =>
  `/images/ko/main/mainProducts_${sortOrder + 1}.png`;

/* ── 폼 상태 타입 ── */
type FormState = {
  title_ko: string;
  title_en: string;
  desc_ko: string;
  desc_en: string;
  image_url: string;
  link_url: string;
  sort_order: number;
};

const emptyForm = (sortOrder = 0): FormState => ({
  title_ko: "",
  title_en: "",
  desc_ko: "",
  desc_en: "",
  image_url: "",
  link_url: "/board/product",
  sort_order: sortOrder,
});

/* ── 제품 폼 컴포넌트 ── */
function ProductForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initial: FormState;
  onSubmit: (form: FormState, file: File | null) => void;
  onCancel?: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(initial.image_url);
  const [tab, setTab] = useState<"ko" | "en">("ko");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof FormState, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    set("image_url", "");
  };

  const valid = form.title_ko.trim() && form.title_en.trim();

  return (
    <div className="space-y-4">
      {/* 언어 탭 */}
      <div className="flex gap-1 border-b border-gray-200 mb-2">
        {(["ko", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === l
                ? "border-[#000081] text-[#000081]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {l === "ko" ? "🇰🇷 한국어" : "🇺🇸 영어"}
          </button>
        ))}
      </div>

      {/* 제목 */}
      <div>
        <label className="label">제목 *</label>
        <input
          type="text"
          className="input"
          placeholder={tab === "ko" ? "예: 메조니들" : "e.g. Meso Needles"}
          value={tab === "ko" ? form.title_ko : form.title_en}
          onChange={(e) =>
            set(tab === "ko" ? "title_ko" : "title_en", e.target.value)
          }
        />
      </div>

      {/* 설명 */}
      <div>
        <label className="label">설명</label>
        <textarea
          rows={3}
          className="input resize-none"
          placeholder={tab === "ko" ? "제품 설명 (한국어)" : "Product description (English)"}
          value={tab === "ko" ? form.desc_ko : form.desc_en}
          onChange={(e) =>
            set(tab === "ko" ? "desc_ko" : "desc_en", e.target.value)
          }
        />
      </div>

      {/* 이미지 업로드 */}
      <div>
        <label className="label">이미지 (미지정 시 기본 이미지 사용)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#000081] transition-colors"
        >
          {preview ? (
            <div className="flex items-center gap-3">
              <img
                src={preview}
                alt="preview"
                className="h-16 w-24 object-cover rounded border border-gray-200"
                onError={() => setPreview("")}
              />
              <span className="text-sm text-gray-500">클릭하여 변경</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm py-3">
              <svg className="mx-auto mb-1 w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              클릭하여 이미지 선택 (JPG, PNG, WEBP)
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        {/* URL 직접 입력 */}
        <input
          type="url"
          className="input mt-2"
          placeholder="또는 이미지 URL 직접 입력"
          value={form.image_url}
          onChange={(e) => {
            set("image_url", e.target.value);
            setPreview(e.target.value);
            setFile(null);
          }}
        />
      </div>

      {/* 링크 URL */}
      <div>
        <label className="label">제품 링크 URL</label>
        <input
          type="text"
          className="input"
          placeholder="/board/product/browse?cat=needle"
          value={form.link_url}
          onChange={(e) => set("link_url", e.target.value)}
        />
      </div>

      {/* 표시 순서 */}
      <div>
        <label className="label">표시 순서</label>
        <input
          type="number"
          className="input w-28"
          min={0}
          value={form.sort_order}
          onChange={(e) => set("sort_order", Number(e.target.value))}
        />
        <p className="text-xs text-gray-400 mt-1">숫자가 작을수록 먼저 표시됩니다.</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <button
          disabled={!valid || isPending}
          onClick={() => onSubmit(form, file)}
          className="btn btn-primary"
        >
          {isPending ? "처리 중..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            취소
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 제품 행 ── */
function ProductRow({
  product,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggle,
  onDelete,
  onEdit,
}: {
  product: HomeProduct;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const imgSrc = product.image_url || defaultImgSrc(index);

  return (
    <div
      className={clsx(
        "flex items-start gap-4 p-4 rounded-xl border transition-colors",
        product.is_active
          ? "border-gray-200 bg-white"
          : "border-dashed border-gray-200 bg-gray-50 opacity-60"
      )}
    >
      {/* 썸네일 */}
      <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
        <img
          src={imgSrc}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm">{product.title_ko}</p>
        <p className="text-xs text-gray-400">{product.title_en}</p>
        {product.desc_ko && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{product.desc_ko}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-xs text-gray-400">순서 {product.sort_order}</span>
          {product.link_url && (
            <span className="text-xs text-gray-400 truncate max-w-32">{product.link_url}</span>
          )}
          <span className={clsx("badge text-xs", product.is_active ? "badge-navy" : "badge-gray")}>
            {product.is_active ? "활성" : "비활성"}
          </span>
          {!product.image_url && (
            <span className="badge badge-gray text-xs">기본이미지</span>
          )}
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            title="위로"
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs"
          >▲</button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="아래로"
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs"
          >▼</button>
        </div>
        <button
          onClick={onToggle}
          className="w-full text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          {product.is_active ? "숨기기" : "표시"}
        </button>
        <button
          onClick={onEdit}
          className="w-full text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
        >수정</button>
        <button
          onClick={onDelete}
          className="w-full text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
        >삭제</button>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export function HomeProductsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: productService.getAllProducts,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  /* 생성 */
  const createMut = useMutation({
    mutationFn: async ({ form, file }: { form: FormState; file: File | null }) => {
      let image_url = form.image_url || undefined;
      if (file) image_url = await productService.uploadImage(file);
      await productService.createProduct({
        title_ko: form.title_ko,
        title_en: form.title_en,
        desc_ko: form.desc_ko || undefined,
        desc_en: form.desc_en || undefined,
        image_url,
        link_url: form.link_url || undefined,
        sort_order: form.sort_order,
      });
    },
    onSuccess: () => { invalidate(); setShowForm(false); },
    onError: (e: Error) => alert(`등록 실패: ${e.message}`),
  });

  /* 수정 */
  const updateMut = useMutation({
    mutationFn: async ({
      id,
      form,
      file,
    }: { id: string; form: FormState; file: File | null }) => {
      let image_url: string | null = form.image_url || null;
      if (file) image_url = await productService.uploadImage(file);
      await productService.updateProduct(id, {
        title_ko: form.title_ko,
        title_en: form.title_en,
        desc_ko: form.desc_ko || null,
        desc_en: form.desc_en || null,
        image_url,
        link_url: form.link_url || null,
        sort_order: form.sort_order,
      });
    },
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError: (e: Error) => alert(`수정 실패: ${e.message}`),
  });

  /* 토글 */
  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      productService.updateProduct(id, { is_active }),
    onSuccess: invalidate,
  });

  /* 삭제 */
  const deleteMut = useMutation({
    mutationFn: async (product: HomeProduct) => {
      await productService.deleteProduct(product.id);
      if (product.image_url) await productService.deleteImage(product.image_url);
    },
    onSuccess: invalidate,
    onError: (e: Error) => alert(`삭제 실패: ${e.message}`),
  });

  /* 순서 이동 */
  const move = (index: number, dir: -1 | 1) => {
    const next = [...products];
    const target = next[index + dir];
    if (!target) return;
    productService
      .reorderProducts([
        { id: next[index].id, sort_order: target.sort_order },
        { id: target.id, sort_order: next[index].sort_order },
      ])
      .then(invalidate);
  };

  if (isLoading && !products.length) return <PageSpinner />;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            메인 홈페이지 PRODUCTS 섹션의 제품 카드를 관리합니다.
            이미지를 업로드하지 않으면 기본 이미지(mainProducts_N.png)가 사용됩니다.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setEditingId(null); }}
          className="btn btn-primary"
        >
          {showForm ? "닫기" : "+ 제품 추가"}
        </button>
      </div>

      {/* Supabase 미설정 안내 */}
      {products.length === 0 && !isLoading && (
        <div className="card p-5 mb-5 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800 font-medium mb-1">📋 초기 데이터가 없습니다</p>
          <p className="text-xs text-amber-700">
            <code className="bg-amber-100 px-1 rounded">productService.ts</code> 파일 상단의 SQL INSERT 구문을 Supabase SQL Editor에서 실행하면
            현재 사이트의 6개 제품이 자동으로 등록됩니다.
          </p>
        </div>
      )}

      {/* 추가 폼 */}
      {showForm && (
        <div className="card p-5 mb-6 border-2 border-[#000081]/20">
          <h2 className="text-base font-bold text-gray-800 mb-4">새 제품 등록</h2>
          <ProductForm
            initial={emptyForm(products.length)}
            onSubmit={(form, file) => createMut.mutate({ form, file })}
            onCancel={() => setShowForm(false)}
            isPending={createMut.isPending}
            submitLabel="등록"
          />
        </div>
      )}

      {/* 제품 목록 */}
      <div className="space-y-3">
        {products.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-lg mb-1">등록된 제품이 없습니다.</p>
            <p className="text-sm">위 버튼을 눌러 제품을 추가하거나 Supabase에 초기 데이터를 삽입하세요.</p>
          </div>
        ) : (
          products.map((product, i) => (
            <div key={product.id}>
              {editingId === product.id ? (
                <div className="card p-5 border-2 border-blue-200">
                  <h2 className="text-sm font-bold text-gray-700 mb-4">제품 수정</h2>
                  <ProductForm
                    initial={{
                      title_ko: product.title_ko,
                      title_en: product.title_en,
                      desc_ko: product.desc_ko ?? "",
                      desc_en: product.desc_en ?? "",
                      image_url: product.image_url ?? "",
                      link_url: product.link_url ?? "",
                      sort_order: product.sort_order,
                    }}
                    onSubmit={(form, file) =>
                      updateMut.mutate({ id: product.id, form, file })
                    }
                    onCancel={() => setEditingId(null)}
                    isPending={updateMut.isPending}
                    submitLabel="수정 저장"
                  />
                </div>
              ) : (
                <ProductRow
                  product={product}
                  index={i}
                  total={products.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  onToggle={() =>
                    toggleMut.mutate({ id: product.id, is_active: !product.is_active })
                  }
                  onDelete={() => {
                    if (confirm(`"${product.title_ko}" 제품을 삭제하시겠습니까?`))
                      deleteMut.mutate(product);
                  }}
                  onEdit={() => { setEditingId(product.id); setShowForm(false); }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {products.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          총 {products.length}개 제품 · 활성 {products.filter((p) => p.is_active).length}개가 메인에 표시됩니다.
        </p>
      )}
    </div>
  );
}
