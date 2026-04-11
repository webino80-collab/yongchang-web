import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificateService, CERT_TYPES } from "@/lib/certificateService";
import { PageSpinner } from "@/components/ui/Spinner";
import type { Certificate } from "@/types";

const EMPTY_FORM: Omit<Certificate, "id" | "created_at"> = {
  title_ko: "",
  title_en: "",
  cert_type: "certificate",
  image_url: "",
  issued_by: "",
  issued_year: "",
  sort_order: 0,
  is_active: true,
};

export function CertificateAdminPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Omit<Certificate, "id" | "created_at">>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { data: certs = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: () => certificateService.getAllCertificates(),
  });

  const formatSaveErr = (e: unknown) => {
    if (!e || typeof e !== "object") return String(e);
    const x = e as { message?: string; details?: string; hint?: string };
    return [x.message, x.details, x.hint].filter(Boolean).join("\n");
  };

  const create = useMutation({
    mutationFn: (payload: typeof EMPTY_FORM) => certificateService.createCertificate(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-certificates"] }); resetForm(); },
    onError: (e) => alert(`등록 실패:\n${formatSaveErr(e)}`),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<typeof EMPTY_FORM> }) =>
      certificateService.updateCertificate(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-certificates"] }); resetForm(); },
    onError: (e) => alert(`저장 실패:\n${formatSaveErr(e)}`),
  });

  const remove = useMutation({
    mutationFn: (id: string) => certificateService.deleteCertificate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-certificates"] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      certificateService.updateCertificate(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-certificates"] }),
  });

  const moveUp = useMutation({
    mutationFn: async (idx: number) => {
      if (!certs || idx === 0) return;
      const ids = certs.map((c) => c.id);
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      await certificateService.reorderCertificates(ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-certificates"] }),
  });

  const moveDown = useMutation({
    mutationFn: async (idx: number) => {
      if (!certs || idx === certs.length - 1) return;
      const ids = certs.map((c) => c.id);
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      await certificateService.reorderCertificates(ids);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-certificates"] }),
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  }

  function startEdit(c: Certificate) {
    setForm({
      title_ko: c.title_ko,
      title_en: c.title_en ?? "",
      cert_type: c.cert_type,
      image_url: c.image_url ?? "",
      issued_by: c.issued_by ?? "",
      issued_year: c.issued_year ?? "",
      sort_order: c.sort_order,
      is_active: c.is_active,
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await certificateService.uploadImage(file);
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_ko.trim()) { alert("인증명(국문)을 입력해주세요."); return; }
    if (editId) {
      update.mutate({ id: editId, payload: form });
    } else {
      create.mutate({ ...form, sort_order: (certs?.length ?? 0) + 1 });
    }
  }

  if (isLoading && !certs.length) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">특허 &amp; 인증 관리</h1>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + 인증 추가
          </button>
        )}
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ 인증 목록을 불러오지 못했습니다</p>
          <p className="mb-2">
            <code>certificates</code> 테이블·RLS·<code>cert-images</code> 버킷이 없을 수 있습니다.{" "}
            <code>010_certificates_ensure_app_columns.sql</code> (또는 전체{" "}
            <code>003_site_content_tables.sql</code>)를 SQL Editor에서 실행하세요.{" "}
            관리자가 JWT <code>app_metadata</code>만 쓰는 경우 <code>004_…jwt…sql</code> 도 필요합니다.
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
            {editId ? "인증 수정" : "새 인증 등록"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">인증명 (국문) *</label>
                <input
                  className="input w-full"
                  value={form.title_ko}
                  onChange={(e) => setForm((p) => ({ ...p, title_ko: e.target.value }))}
                  placeholder="예: 의료기기 제조업 허가증"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">인증명 (영문)</label>
                <input
                  className="input w-full"
                  value={form.title_en ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
                  placeholder="예: Medical Device Manufacturing License"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">구분</label>
                <select
                  className="input w-full"
                  value={form.cert_type}
                  onChange={(e) => setForm((p) => ({ ...p, cert_type: e.target.value }))}
                >
                  {CERT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.labelKo} ({t.labelEn})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발급 기관</label>
                <input
                  className="input w-full"
                  value={form.issued_by ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, issued_by: e.target.value }))}
                  placeholder="예: 식품의약품안전처"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">취득 연도</label>
                <input
                  className="input w-full"
                  value={form.issued_year ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, issued_year: e.target.value }))}
                  placeholder="예: 2023"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">인증서 이미지</label>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    className="input w-full"
                    value={form.image_url ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://... 또는 아래 업로드"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm shrink-0"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "업로드 중..." : "파일 선택"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="mt-2 h-28 object-contain rounded border border-gray-200" />
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

      {/* 갤러리 목록 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {certs?.map((c, idx) => (
          <div key={c.id} className={`card overflow-hidden ${c.is_active ? "" : "opacity-50"}`}>
            {c.image_url ? (
              <img src={c.image_url} alt={c.title_ko} className="w-full aspect-[3/4] object-contain bg-gray-50" />
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                이미지 없음
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-800 line-clamp-2">{c.title_ko}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="badge badge-blue text-[10px]">
                  {CERT_TYPES.find((t) => t.value === c.cert_type)?.labelKo ?? c.cert_type}
                </span>
                {c.issued_year && <span className="text-[10px] text-gray-400">{c.issued_year}</span>}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => moveUp.mutate(idx)}
                    disabled={idx === 0}
                    className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1"
                  >▲</button>
                  <button
                    onClick={() => moveDown.mutate(idx)}
                    disabled={idx === (certs?.length ?? 0) - 1}
                    className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30 px-1"
                  >▼</button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive.mutate({ id: c.id, is_active: !c.is_active })}
                    className={`text-[10px] ${c.is_active ? "text-green-600" : "text-red-400"} hover:underline`}
                  >{c.is_active ? "활성" : "비활성"}</button>
                  <span className="text-gray-200">|</span>
                  <button onClick={() => startEdit(c)} className="text-[10px] text-indigo-600 hover:underline">수정</button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => { if (confirm(`"${c.title_ko}"을(를) 삭제하시겠습니까?`)) remove.mutate(c.id); }}
                    className="text-[10px] text-red-500 hover:underline"
                  >삭제</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!certs?.length && (
        <div className="py-16 text-center text-gray-400">등록된 인증이 없습니다.</div>
      )}
    </div>
  );
}
