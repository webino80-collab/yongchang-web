import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageSpinner } from "@/components/ui/Spinner";
import { assetRenewalService, type AssetRenewalInput } from "@/lib/assetRenewalService";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/lib/adminAccess";
import type { AssetRenewal } from "@/types";

const EMPTY_FORM: AssetRenewalInput = {
  asset_type: "ssl",
  asset_name: "",
  provider: "",
  target: "",
  expires_at: "",
  notify_days_before: 14,
  notify_email: "jmpapa@kakao.com",
  is_active: true,
  notes: "",
};

function daysLeft(expiresAt: string): number {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${expiresAt}T00:00:00`);
  return Math.ceil((target.getTime() - start.getTime()) / 86_400_000);
}

export function RenewalAlertsAdminPage() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [form, setForm] = useState<AssetRenewalInput>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const superAdmin = isSuperAdmin(profile);

  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-asset-renewals"],
    queryFn: () => assetRenewalService.list(),
    enabled: superAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: AssetRenewalInput) =>
      editId ? assetRenewalService.update(editId, payload) : assetRenewalService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-asset-renewals"] });
      resetForm();
      alert("저장되었습니다.");
    },
    onError: (e: Error) => alert(e.message || "저장에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetRenewalService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-asset-renewals"] }),
    onError: (e: Error) => alert(e.message || "삭제에 실패했습니다."),
  });

  const sendNowMutation = useMutation({
    mutationFn: () => assetRenewalService.sendDueAlertsNow(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-asset-renewals"] });
      alert("알림 발송 작업을 실행했습니다.");
    },
    onError: (e: Error) => alert(e.message || "알림 실행에 실패했습니다."),
  });

  const sorted = useMemo(() => [...data].sort((a, b) => a.expires_at.localeCompare(b.expires_at)), [data]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
  }

  function startEdit(row: AssetRenewal) {
    setEditId(row.id);
    setForm({
      asset_type: row.asset_type,
      asset_name: row.asset_name,
      provider: row.provider ?? "",
      target: row.target ?? "",
      expires_at: row.expires_at,
      notify_days_before: row.notify_days_before,
      notify_email: row.notify_email,
      is_active: row.is_active,
      notes: row.notes ?? "",
      last_notified_at: row.last_notified_at,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.asset_name.trim()) return alert("자산 이름을 입력해 주세요.");
    if (!form.expires_at) return alert("만료일을 입력해 주세요.");
    if (!form.notify_email.trim()) return alert("알림 이메일을 입력해 주세요.");
    saveMutation.mutate({
      ...form,
      asset_name: form.asset_name.trim(),
      provider: form.provider?.trim() ?? "",
      target: form.target?.trim() ?? "",
      notify_email: form.notify_email.trim(),
      notes: form.notes?.trim() ?? "",
    });
  }

  if (!superAdmin) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        최고 관리자(레벨 10)만 접근할 수 있습니다.
      </div>
    );
  }

  if (isLoading && !data.length) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">갱신 알림 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            호스팅/SSL 만료일을 등록해 두면 만료일 기준 N일 전(기본 14일) 메일 알림을 발송합니다.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => void sendNowMutation.mutate()}
          disabled={sendNowMutation.isPending}
        >
          {sendNowMutation.isPending ? "실행 중…" : "지금 알림 체크 실행"}
        </button>
      </div>

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">목록을 불러오지 못했습니다.</p>
          <p className="mt-1 font-mono text-xs break-all">{error instanceof Error ? error.message : String(error)}</p>
          <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => void refetch()}>
            다시 시도
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              className="input w-full"
              value={form.asset_type}
              onChange={(e) => setForm((p) => ({ ...p, asset_type: e.target.value as "hosting" | "ssl" }))}
            >
              <option value="ssl">SSL 인증서</option>
              <option value="hosting">호스팅</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">자산 이름 *</label>
            <input
              className="input w-full"
              value={form.asset_name}
              onChange={(e) => setForm((p) => ({ ...p, asset_name: e.target.value }))}
              placeholder="예: yongchang.co.kr SSL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대상(도메인/서비스)</label>
            <input
              className="input w-full"
              value={form.target ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
              placeholder="예: yongchang.co.kr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공급사</label>
            <input
              className="input w-full"
              value={form.provider ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
              placeholder="예: Cafe24 / AWS / 가비아"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">만료일 *</label>
            <input
              type="date"
              className="input w-full"
              value={form.expires_at}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사전 알림 일수</label>
            <input
              type="number"
              min={1}
              max={365}
              className="input w-full"
              value={form.notify_days_before}
              onChange={(e) => setForm((p) => ({ ...p, notify_days_before: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">알림 이메일 *</label>
            <input
              type="email"
              className="input w-full"
              value={form.notify_email}
              onChange={(e) => setForm((p) => ({ ...p, notify_email: e.target.value }))}
              placeholder="jmpapa@kakao.com"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              알림 활성화
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea
            className="input w-full min-h-[5rem] resize-y"
            value={form.notes ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "저장 중…" : editId ? "수정 저장" : "신규 등록"}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
            취소
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left">유형</th>
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">대상</th>
                <th className="px-3 py-2 text-left">만료일</th>
                <th className="px-3 py-2 text-center">D-day</th>
                <th className="px-3 py-2 text-center">알림</th>
                <th className="px-3 py-2 text-left">이메일</th>
                <th className="px-3 py-2 text-left">마지막 알림</th>
                <th className="px-3 py-2 text-right">작업</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const d = daysLeft(row.expires_at);
                return (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="px-3 py-2">{row.asset_type === "ssl" ? "SSL" : "HOSTING"}</td>
                    <td className="px-3 py-2 font-medium">{row.asset_name}</td>
                    <td className="px-3 py-2 text-gray-600">{row.target ?? "-"}</td>
                    <td className="px-3 py-2">{row.expires_at}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`badge ${d <= 14 ? "badge-red" : "badge-blue"}`}>{d >= 0 ? `D-${d}` : "만료"}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{row.notify_days_before}일 전</td>
                    <td className="px-3 py-2 text-gray-600">{row.notify_email}</td>
                    <td className="px-3 py-2 text-gray-500">{row.last_notified_at ? new Date(row.last_notified_at).toLocaleString("ko-KR") : "-"}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button type="button" className="text-xs text-indigo-600 hover:underline mr-3" onClick={() => startEdit(row)}>
                        수정
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() => {
                          if (confirm(`"${row.asset_name}" 항목을 삭제할까요?`)) {
                            deleteMutation.mutate(row.id);
                          }
                        }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!sorted.length && (
                <tr>
                  <td colSpan={9} className="px-3 py-10 text-center text-gray-400">
                    등록된 갱신 알림 항목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

