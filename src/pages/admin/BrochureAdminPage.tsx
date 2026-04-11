import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { brochureService } from "@/lib/brochureService";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Brochure } from "@/types";

const BROCHURE_CATEGORIES = [
  { value: "제품 카탈로그",  labelEn: "Product Catalog" },
  { value: "회사 소개서",   labelEn: "Company Profile" },
  { value: "제품 기술문서", labelEn: "Technical Document" },
  { value: "기타",          labelEn: "Other" },
];

const EMPTY_FORM: Omit<Brochure, "id" | "created_at"> = {
  title_ko: "",
  title_en: "",
  desc_ko: "",
  desc_en: "",
  cover_image_url: "",
  file_url: "",
  file_size: null,
  category: "제품 카탈로그",
  sort_order: 0,
  is_active: true,
};

export function BrochureAdminPage() {
  const queryClient = useQueryClient();
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<Brochure, "id" | "created_at">>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: brochures = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-brochures"],
    queryFn: () => brochureService.getAllBrochures(),
  });

  const formatSaveErr = (e: unknown) => {
    if (!e || typeof e !== "object") return String(e);
    const x = e as { message?: string; details?: string; hint?: string };
    return [x.message, x.details, x.hint].filter(Boolean).join("\n");
  };

  const create = useMutation({
    mutationFn: (payload: typeof EMPTY_FORM) => brochureService.createBrochure(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-brochures"] }); resetForm(); },
    onError: (e) => alert(`등록 실패:\n${formatSaveErr(e)}`),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<typeof EMPTY_FORM> }) =>
      brochureService.updateBrochure(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-brochures"] }); resetForm(); },
    onError: (e) => alert(`저장 실패:\n${formatSaveErr(e)}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => brochureService.deleteBrochure(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-brochures"] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      brochureService.updateBrochure(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-brochures"] }),
  });

  const moveUp = useMutation({
    mutationFn: async (idx: number) => {
      if (!brochures || idx === 0) return;
      const ids = brochures.map((b) => b.id);
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      await brochureService.reorderBrochures(ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-brochures"] }),
  });

  const moveDown = useMutation({
    mutationFn: async (idx: number) => {
      if (!brochures || idx === brochures.length - 1) return;
      const ids = brochures.map((b) => b.id);
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      await brochureService.reorderBrochures(ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-brochures"] }),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(b: Brochure) {
    setForm({
      title_ko: b.title_ko,
      title_en: b.title_en ?? "",
      desc_ko: b.desc_ko ?? "",
      desc_en: b.desc_en ?? "",
      cover_image_url: b.cover_image_url ?? "",
      file_url: b.file_url ?? "",
      file_size: b.file_size,
      category: b.category ?? "제품 카탈로그",
      sort_order: b.sort_order,
      is_active: b.is_active,
    });
    setEditId(b.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await brochureService.uploadCoverImage(file);
      setForm((prev) => ({ ...prev, cover_image_url: url }));
    } catch {
      alert("커버 이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const { url, size } = await brochureService.uploadFile(file);
      setForm((prev) => ({ ...prev, file_url: url, file_size: size }));
    } catch {
      alert("파일 업로드에 실패했습니다.");
    } finally {
      setUploadingFile(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_ko.trim()) { alert("브로셔명(국문)을 입력해주세요."); return; }
    if (editId) {
      update.mutate({ id: editId, payload: form });
    } else {
      create.mutate({ ...form, sort_order: (brochures?.length ?? 0) + 1 });
    }
  }

  if (isLoading && !brochures.length) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">브로셔 관리</h1>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + 브로셔 추가
          </button>
        )}
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ 브로셔 목록을 불러오지 못했습니다</p>
          <p className="mb-2">
            테이블이 없거나 RLS·권한 문제일 수 있습니다.{" "}
            <code>brochureService.ts</code> 상단 SQL을 Supabase SQL Editor에서 실행했는지 확인하세요. (
            <code>brochures</code> 테이블 + <code>brochure-files</code> 버킷)
          </p>
          <p className="text-xs font-mono text-amber-900/80 break-all">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      )}

      {/* 폼 */}
      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {editId ? "브로셔 수정" : "새 브로셔 등록"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  className="input w-full"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  {BROCHURE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">브로셔명 (국문) *</label>
                <input
                  className="input w-full"
                  value={form.title_ko}
                  onChange={(e) => setForm((p) => ({ ...p, title_ko: e.target.value }))}
                  placeholder="예: 용창 제품 카탈로그 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">브로셔명 (영문)</label>
                <input
                  className="input w-full"
                  value={form.title_en ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
                  placeholder="예: Yongchang Product Catalog 2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (국문)</label>
                <textarea
                  className="input w-full h-20 resize-none"
                  value={form.desc_ko ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, desc_ko: e.target.value }))}
                  placeholder="브로셔 설명 (국문)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명 (영문)</label>
                <textarea
                  className="input w-full h-20 resize-none"
                  value={form.desc_en ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, desc_en: e.target.value }))}
                  placeholder="Brochure description (English)"
                />
              </div>
            </div>

            {/* 커버 이미지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">커버 이미지</label>
              <div className="flex gap-3 items-start">
                <input
                  className="input flex-1"
                  value={form.cover_image_url ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, cover_image_url: e.target.value }))}
                  placeholder="https://... 또는 아래 업로드"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm shrink-0"
                  onClick={() => coverRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? "업로드 중..." : "이미지 선택"}
                </button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </div>
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt="cover" className="mt-2 h-28 object-contain rounded border border-gray-200" />
              )}
            </div>

            {/* PDF 파일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDF 파일</label>
              <div className="flex gap-3 items-start">
                <input
                  className="input flex-1"
                  value={form.file_url ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, file_url: e.target.value }))}
                  placeholder="https://... (PDF URL) 또는 아래 업로드"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm shrink-0"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? "업로드 중..." : "PDF 선택"}
                </button>
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} />
              </div>
              {form.file_url && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ 파일 등록됨 {form.file_size ? `(${brochureService.formatFileSize(form.file_size)})` : ""}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded"
                />
                활성화 (사이트에 노출)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={create.isPending || update.isPending}
              >
                {editId ? "수정 완료" : "등록"}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 목록 */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 font-medium w-10">#</th>
              <th className="px-4 py-3 text-left text-gray-600 font-medium">브로셔명</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden md:table-cell">카테고리</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium hidden md:table-cell">파일</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">상태</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">순서</th>
              <th className="px-4 py-3 text-center text-gray-600 font-medium">작업</th>
            </tr>
          </thead>
          <tbody>
            {brochures?.map((b, idx) => (
              <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {b.cover_image_url ? (
                      <img src={b.cover_image_url} alt={b.title_ko} className="w-10 h-14 object-cover rounded border border-gray-200 bg-gray-50 shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center text-gray-300 text-[10px]">PDF</div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{b.title_ko}</p>
                      {b.title_en && <p className="text-xs text-gray-400">{b.title_en}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <span className="badge badge-blue text-xs">{b.category || "미분류"}</span>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  {b.file_url ? (
                    <a href={b.file_url} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs hover:underline">
                      다운로드 {b.file_size ? `(${brochureService.formatFileSize(b.file_size)})` : ""}
                    </a>
                  ) : (
                    <span className="text-gray-300 text-xs">파일 없음</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}
                    className={`badge ${b.is_active ? "badge-green" : "badge-red"} cursor-pointer`}
                  >
                    {b.is_active ? "활성" : "비활성"}
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => moveUp.mutate(idx)}
                      disabled={idx === 0 || moveUp.isPending}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    >▲</button>
                    <button
                      onClick={() => moveDown.mutate(idx)}
                      disabled={idx === (brochures?.length ?? 0) - 1 || moveDown.isPending}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                    >▼</button>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => startEdit(b)} className="text-xs text-indigo-600 hover:underline">수정</button>
                    <button
                      onClick={() => { if (confirm(`"${b.title_ko}"을(를) 삭제하시겠습니까?`)) remove.mutate(b.id); }}
                      className="text-xs text-red-500 hover:underline"
                    >삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!brochures?.length && (
          <div className="py-16 text-center text-gray-400">등록된 브로셔가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
