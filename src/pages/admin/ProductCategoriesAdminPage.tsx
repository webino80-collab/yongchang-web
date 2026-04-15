import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productCategoryService, staticFallbackProductCategories } from "@/lib/productCategoryService";
import { PageSpinner } from "@/components/ui/Spinner";
import type { ProductCategory } from "@/types";

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

function cloneRows(rows: ProductCategory[]): ProductCategory[] {
  return rows.map((r) => ({ ...r }));
}

export function ProductCategoriesAdminPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ProductCategory[]>([]);

  const { data: rows = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product-categories-admin"],
    queryFn: () => productCategoryService.getAllForAdmin(),
  });

  useEffect(() => {
    if (rows.length) setDraft(cloneRows(rows));
    else setDraft(cloneRows(staticFallbackProductCategories()));
  }, [rows]);

  const saveMutation = useMutation({
    mutationFn: (payload: ProductCategory[]) => productCategoryService.upsertMany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories-admin"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories-public"] });
      alert("저장되었습니다.");
    },
    onError: (e: Error) => alert(e.message || "저장에 실패했습니다."),
  });

  function setRow(i: number, patch: Partial<ProductCategory>) {
    setDraft((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function moveRow(i: number, dir: -1 | 1) {
    const j = i + dir;
    setDraft((prev) => {
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      const [a] = copy.splice(i, 1);
      copy.splice(j, 0, a);
      return copy.map((r, idx) => ({ ...r, sort_order: idx + 1 }));
    });
  }

  function addRow() {
    setDraft((prev) => {
      const nextOrder = prev.reduce((m, r) => Math.max(m, r.sort_order), 0) + 1;
      return [
        ...prev,
        {
          slug: "",
          label_ko: "",
          label_en: "",
          sort_order: nextOrder,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
      ];
    });
  }

  function removeDraftRow(i: number) {
    setDraft((prev) => prev.filter((_, j) => j !== i).map((r, idx) => ({ ...r, sort_order: idx + 1 })));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slugs = new Set<string>();
    for (let i = 0; i < draft.length; i++) {
      const s = draft[i].slug.trim();
      if (!s) {
        alert(`${i + 1}행: 분류 코드(slug)를 입력하세요. (영문 소문자·숫자·밑줄, 첫 글자는 영문)`);
        return;
      }
      if (!SLUG_PATTERN.test(s)) {
        alert(`${i + 1}행: slug "${s}" 형식이 올바르지 않습니다. 예: needle, my_category`);
        return;
      }
      if (slugs.has(s)) {
        alert(`slug "${s}" 가 중복되었습니다.`);
        return;
      }
      slugs.add(s);
      if (!draft[i].label_ko.trim() || !draft[i].label_en.trim()) {
        alert(`${i + 1}행: 국문·영문 표시명을 모두 입력하세요.`);
        return;
      }
    }
    const normalized = draft.map((r, idx) => ({
      ...r,
      slug: r.slug.trim(),
      label_ko: r.label_ko.trim(),
      label_en: r.label_en.trim(),
      sort_order: idx + 1,
    }));
    saveMutation.mutate(normalized);
  }

  if (isLoading && !rows.length && draft.length === 0) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">제품 분류</h1>
        <p className="text-sm text-gray-500 mt-1">
          제품소개에서 사용하는 분류 코드(slug)와 국·영문 이름입니다. <code className="text-xs bg-gray-100 px-1 rounded">products.category</code> 필드와
          slug가 같아야 합니다. 헤더 메뉴·제품 목록 필터에 반영됩니다.
        </p>
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
          <p className="font-semibold mb-1">DB를 불러오지 못했습니다</p>
          <p className="font-mono text-xs break-all mb-2">{error instanceof Error ? error.message : String(error)}</p>
          <p className="mb-2">
            <code className="bg-amber-100 px-1 rounded">supabase/migrations/022_product_categories.sql</code> 을 Supabase에 적용했는지 확인하세요.
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refetch()}>
            다시 시도
          </button>
        </div>
      )}

      {!isError && rows.length === 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <p className="font-semibold mb-1">아직 DB에 분류 행이 없습니다</p>
          <p>아래 초기값을 그대로 저장하면 시드와 동일하게 등록됩니다. 또는 SQL 마이그레이션을 먼저 실행하세요.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium w-10">순</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">slug</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">국문</th>
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">영문</th>
                  <th className="px-3 py-2 text-center text-gray-600 font-medium">노출</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">순서</th>
                </tr>
              </thead>
              <tbody>
                {draft.map((row, i) => (
                  <tr key={`${row.slug || "new"}-${i}`} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-full font-mono text-xs"
                        value={row.slug}
                        onChange={(e) => setRow(i, { slug: e.target.value })}
                        placeholder="needle"
                        spellCheck={false}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-full"
                        value={row.label_ko}
                        onChange={(e) => setRow(i, { label_ko: e.target.value })}
                        placeholder="국문 표시명"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-full"
                        value={row.label_en}
                        onChange={(e) => setRow(i, { label_en: e.target.value })}
                        placeholder="English"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) => setRow(i, { is_active: e.target.checked })}
                        className="rounded"
                      />
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button type="button" className="btn btn-secondary btn-sm mr-1" disabled={i === 0} onClick={() => moveRow(i, -1)}>
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm mr-1"
                        disabled={i === draft.length - 1}
                        onClick={() => moveRow(i, 1)}
                      >
                        ↓
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm text-red-700" onClick={() => removeDraftRow(i)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={addRow}>
            + 분류 추가
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setDraft(cloneRows(staticFallbackProductCategories()))}>
            코드 기본값으로 되돌리기
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
          <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "저장 중…" : "분류 저장"}
          </button>
          <span className="text-sm text-gray-500">저장 후 제품소개 관리·사이트 메뉴에 곧바로 반영됩니다.</span>
        </div>
      </form>
    </div>
  );
}
