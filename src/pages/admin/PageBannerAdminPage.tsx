import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pageBannerService, PAGE_KEYS } from "@/lib/pageBannerService";
import { PageSpinner } from "@/components/ui/Spinner";
import type { PageBanner } from "@/types";

type BannerForm = {
  image_url: string;
  title_ko: string;
  title_en: string;
  subtitle_ko: string;
  subtitle_en: string;
  is_active: boolean;
};

const EMPTY_FORM: BannerForm = {
  image_url: "",
  title_ko: "",
  title_en: "",
  subtitle_ko: "",
  subtitle_en: "",
  is_active: true,
};

export function PageBannerAdminPage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editKey, setEditKey]   = useState<string | null>(null);
  const [form, setForm]         = useState<BannerForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-page-banners"],
    queryFn: () => pageBannerService.getAllBanners(),
  });

  const upsert = useMutation({
    mutationFn: ({ pageKey, payload }: { pageKey: string; payload: BannerForm }) =>
      pageBannerService.upsertBanner(pageKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-banners"] });
      queryClient.invalidateQueries({ queryKey: ["page-banner"] });
      setEditKey(null);
    },
  });

  function startEdit(pageKey: string) {
    const existing = banners?.find((b) => b.page_key === pageKey);
    if (existing) {
      setForm({
        image_url:   existing.image_url   ?? "",
        title_ko:    existing.title_ko    ?? "",
        title_en:    existing.title_en    ?? "",
        subtitle_ko: existing.subtitle_ko ?? "",
        subtitle_en: existing.subtitle_en ?? "",
        is_active:   existing.is_active,
      });
    } else {
      const defaults = PAGE_KEYS.find((p) => p.key === pageKey);
      setForm({
        ...EMPTY_FORM,
        title_ko: defaults?.labelKo ?? "",
        title_en: defaults?.labelEn ?? "",
      });
    }
    setEditKey(pageKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await pageBannerService.uploadImage(file);
      setForm((p) => ({ ...p, image_url: url }));
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editKey) return;
    upsert.mutate({ pageKey: editKey, payload: form });
  }

  const getBannerByKey = (key: string): PageBanner | undefined =>
    banners?.find((b) => b.page_key === key);

  if (isLoading && !banners.length) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">페이지 배너 관리</h1>
        <p className="text-sm text-gray-500 mt-1">제품소개, 특허·인증, 브로셔 페이지 상단 배너 이미지와 문구를 관리합니다.</p>
      </div>

      {/* SQL 안내 */}
      {!banners?.length && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Supabase 초기 설정 필요</p>
          <p>
            <code>pageBannerService.ts</code> 파일 상단의 SQL 주석을 Supabase SQL Editor에서 실행해주세요.
            (<code>page_banners</code> 테이블 + <code>banner-images</code> 버킷 생성)
          </p>
        </div>
      )}

      {/* 수정 폼 */}
      {editKey && (
        <div className="card p-6 mb-6 border-2 border-indigo-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {PAGE_KEYS.find((p) => p.key === editKey)?.labelKo ?? editKey} 배너 수정
            </h2>
            <button
              className="text-sm text-gray-400 hover:text-gray-700"
              onClick={() => setEditKey(null)}
            >✕ 닫기</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 배너 이미지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">배너 이미지</label>
              <div className="flex gap-3 items-start">
                <input
                  className="input flex-1"
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://... 또는 파일 선택"
                />
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
                <div className="mt-2 relative rounded-lg overflow-hidden" style={{ height: "12rem" }}>
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <p className="text-white text-sm">미리보기</p>
                  </div>
                </div>
              )}
            </div>

            {/* 제목 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 (국문)</label>
                <input
                  className="input w-full"
                  value={form.title_ko}
                  onChange={(e) => setForm((p) => ({ ...p, title_ko: e.target.value }))}
                  placeholder="예: 제품소개"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목 (영문)</label>
                <input
                  className="input w-full"
                  value={form.title_en}
                  onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
                  placeholder="예: PRODUCTS"
                />
              </div>
            </div>

            {/* 부제 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부제 (국문)</label>
                <input
                  className="input w-full"
                  value={form.subtitle_ko}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle_ko: e.target.value }))}
                  placeholder="예: 혁신적인 기술로 글로벌 스탠다드를 다시 씁니다."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">부제 (영문)</label>
                <input
                  className="input w-full"
                  value={form.subtitle_en}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle_en: e.target.value }))}
                  placeholder="예: Rewriting the Global Standard..."
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  className="rounded"
                />
                활성화
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={upsert.isPending}>
                {upsert.isPending ? "저장 중..." : "저장"}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditKey(null)}>
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 페이지별 배너 목록 */}
      <div className="space-y-4">
        {PAGE_KEYS.map(({ key, labelKo }) => {
          const banner = getBannerByKey(key);
          return (
            <div key={key} className="card overflow-hidden">
              <div className="flex items-stretch">
                {/* 배너 미리보기 */}
                <div
                  className="shrink-0 hidden sm:block"
                  style={{ width: 200, height: 110, position: "relative", backgroundColor: "#1a1a2e" }}
                >
                  {banner?.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={labelKo}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-2">
                    <p className="text-xs font-bold text-center leading-tight opacity-90" style={{ fontSize: "1.1rem" }}>
                      {banner?.title_ko || labelKo}
                    </p>
                    {banner?.subtitle_ko && (
                      <p className="text-[10px] text-center opacity-60 mt-1 line-clamp-2" style={{ fontSize: "0.9rem" }}>
                        {banner.subtitle_ko}
                      </p>
                    )}
                  </div>
                </div>

                {/* 정보 */}
                <div className="flex-1 p-4 flex items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-800">{labelKo}</span>
                      {banner ? (
                        <span className={`badge ${banner.is_active ? "badge-green" : "badge-red"} text-xs`}>
                          {banner.is_active ? "활성" : "비활성"}
                        </span>
                      ) : (
                        <span className="badge badge-red text-xs">미등록</span>
                      )}
                    </div>
                    {banner?.image_url ? (
                      <p className="text-xs text-gray-400 truncate max-w-sm">{banner.image_url}</p>
                    ) : (
                      <p className="text-xs text-gray-400">이미지 미등록 (기본 그라디언트 사용)</p>
                    )}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm shrink-0"
                    onClick={() => startEdit(key)}
                  >
                    {banner ? "수정" : "등록"}
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
