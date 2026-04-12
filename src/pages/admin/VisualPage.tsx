import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { visualService } from "@/lib/visualService";
import { homeRollingService } from "@/lib/homeRollingService";
import { PageSpinner } from "@/components/ui/Spinner";
import { clsx } from "clsx";
import type { HeroSlide, HomeRollingSlide } from "@/types";

const QUERY_KEY = ["admin-hero-slides"];
const QUERY_KEY_ROLLING = ["admin-home-rolling-slides"];

type FormState = {
  main_text: string;
  main_text_en: string;
  sub_text: string;
  sub_text_en: string;
  image_url: string;
  sort_order: number;
};

const emptyForm: FormState = {
  main_text: "",
  main_text_en: "",
  sub_text: "",
  sub_text_en: "",
  image_url: "",
  sort_order: 0,
};

/* ── 슬라이드 등록/수정 폼 ── */
function SlideForm({
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
  const [uploadMode, setUploadMode] = useState<"file" | "url">(
    initial.image_url ? "url" : "file"
  );
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

  const handleUrlChange = (v: string) => {
    set("image_url", v);
    setPreview(v);
    setFile(null);
  };

  const valid =
    form.main_text.trim() &&
    (uploadMode === "file" ? !!file || !!initial.image_url : !!form.image_url.trim());

  return (
    <div className="space-y-4">
      {/* 이미지 입력 방식 선택 */}
      <div>
        <label className="label">이미지</label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={clsx(
              "px-3 py-1.5 rounded text-sm font-medium border transition-colors",
              uploadMode === "file"
                ? "bg-[#000081] text-white border-[#000081]"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            )}
          >
            파일 업로드
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={clsx(
              "px-3 py-1.5 rounded text-sm font-medium border transition-colors",
              uploadMode === "url"
                ? "bg-[#000081] text-white border-[#000081]"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            )}
          >
            URL 입력
          </button>
        </div>

        {uploadMode === "file" ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#000081] transition-colors"
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="mx-auto max-h-36 object-cover rounded"
              />
            ) : (
              <div className="text-gray-400 text-sm py-4">
                <svg className="mx-auto mb-2 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                클릭하여 이미지 선택 (JPG, PNG, WEBP)
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        ) : (
          <div>
            <input
              type="url"
              className="input"
              placeholder="https://example.com/image.jpg"
              value={form.image_url}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="mt-2 max-h-32 object-cover rounded border border-gray-200"
                onError={() => setPreview("")}
              />
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 -mt-1 mb-2">
        메인·서브 모두 <strong>첫 줄바꿈</strong> 앞뒤가 큰 제목(또는 서브)의 두 줄로 나뉩니다. 영문은 비우면 해당 언어에서 국문이 대신 표시됩니다.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="label">메인 텍스트 (국문) *</label>
          <textarea
            rows={3}
            className="input resize-y min-h-[5.5rem]"
            placeholder={"첫 줄\n둘째 줄 (선택)"}
            value={form.main_text}
            onChange={(e) => set("main_text", e.target.value)}
          />
        </div>
        <div>
          <label className="label">메인 텍스트 (영문)</label>
          <textarea
            rows={3}
            className="input resize-y min-h-[5.5rem]"
            placeholder={"Line 1\nLine 2 (optional)"}
            value={form.main_text_en}
            onChange={(e) => set("main_text_en", e.target.value)}
          />
        </div>
        <div>
          <label className="label">서브 텍스트 (국문)</label>
          <textarea
            rows={3}
            className="input resize-y min-h-[5.5rem]"
            placeholder={"첫 줄\n둘째 줄 (선택)"}
            value={form.sub_text}
            onChange={(e) => set("sub_text", e.target.value)}
          />
        </div>
        <div>
          <label className="label">서브 텍스트 (영문)</label>
          <textarea
            rows={3}
            className="input resize-y min-h-[5.5rem]"
            placeholder={"Line 1\nLine 2 (optional)"}
            value={form.sub_text_en}
            onChange={(e) => set("sub_text_en", e.target.value)}
          />
        </div>
      </div>

      {/* 순서 */}
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

/* ── 슬라이드 행 ── */
function SlideRow({
  slide,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggle,
  onDelete,
  onEdit,
}: {
  slide: HeroSlide;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-4 p-4 rounded-xl border transition-colors",
        slide.is_active ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50 opacity-60"
      )}
    >
      {/* 썸네일 */}
      <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
        {slide.image_url ? (
          <img
            src={slide.image_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            이미지 없음
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm line-clamp-2 whitespace-pre-line leading-snug">
          {slide.main_text}
        </p>
        {slide.main_text_en?.trim() && (
          <p className="text-xs text-blue-700/80 mt-0.5 line-clamp-2 whitespace-pre-line leading-snug">
            EN: {slide.main_text_en}
          </p>
        )}
        {slide.sub_text && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">서브: {slide.sub_text}</p>
        )}
        {slide.sub_text_en?.trim() && (
          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">서브 EN: {slide.sub_text_en}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-gray-400">순서 {slide.sort_order}</span>
          <span
            className={clsx(
              "badge text-xs",
              slide.is_active ? "badge-navy" : "badge-gray"
            )}
          >
            {slide.is_active ? "활성" : "비활성"}
          </span>
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
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            title="아래로"
            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-xs"
          >
            ▼
          </button>
        </div>
        <button
          onClick={onToggle}
          title={slide.is_active ? "비활성화" : "활성화"}
          className="w-full text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-100"
        >
          {slide.is_active ? "숨기기" : "표시"}
        </button>
        <button
          onClick={onEdit}
          className="w-full text-xs px-2 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="w-full text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

type RollingFormState = { image_url: string; image_url_en: string; sort_order: number };

type RollingImageFiles = { ko: File | null; en: File | null };

/* ── 롤링 이미지 폼: 국문(필수) + 영문(선택) ── */
function RollingImageForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  initial: RollingFormState;
  onSubmit: (form: RollingFormState, files: RollingImageFiles) => void;
  onCancel?: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<RollingFormState>(initial);
  const [fileKo, setFileKo] = useState<File | null>(null);
  const [fileEn, setFileEn] = useState<File | null>(null);
  const [previewKo, setPreviewKo] = useState(initial.image_url);
  const [previewEn, setPreviewEn] = useState(initial.image_url_en ?? "");
  const [uploadModeKo, setUploadModeKo] = useState<"file" | "url">(
    initial.image_url ? "url" : "file"
  );
  const [uploadModeEn, setUploadModeEn] = useState<"file" | "url">(
    (initial.image_url_en ?? "").trim() ? "url" : "file"
  );
  const fileKoRef = useRef<HTMLInputElement>(null);
  const fileEnRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(initial);
    setFileKo(null);
    setFileEn(null);
    setPreviewKo(initial.image_url);
    setPreviewEn(initial.image_url_en ?? "");
    setUploadModeKo(initial.image_url ? "url" : "file");
    setUploadModeEn((initial.image_url_en ?? "").trim() ? "url" : "file");
  }, [initial.image_url, initial.image_url_en, initial.sort_order]);

  const validKo =
    uploadModeKo === "file" ? !!fileKo || !!form.image_url.trim() : !!form.image_url.trim();

  const modeBtn = (active: boolean) =>
    clsx(
      "px-3 py-1.5 rounded text-sm font-medium border transition-colors",
      active
        ? "bg-[#000081] text-white border-[#000081]"
        : "bg-white text-gray-600 border-gray-300"
    );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">국문 이미지 (필수)</p>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setUploadModeKo("file")} className={modeBtn(uploadModeKo === "file")}>
            파일 업로드
          </button>
          <button type="button" onClick={() => setUploadModeKo("url")} className={modeBtn(uploadModeKo === "url")}>
            URL 입력
          </button>
        </div>
        {uploadModeKo === "file" ? (
          <div
            onClick={() => fileKoRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#000081] bg-white"
          >
            {previewKo ? (
              <img src={previewKo} alt="" className="mx-auto max-h-40 object-contain rounded" />
            ) : (
              <p className="text-gray-400 text-sm py-4">클릭하여 이미지 선택</p>
            )}
            <input
              ref={fileKoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFileKo(f);
                setPreviewKo(URL.createObjectURL(f));
                setForm((p) => ({ ...p, image_url: "" }));
              }}
            />
          </div>
        ) : (
          <div>
            <input
              type="url"
              className="input"
              placeholder="https://..."
              value={form.image_url}
              onChange={(e) => {
                setForm((p) => ({ ...p, image_url: e.target.value }));
                setPreviewKo(e.target.value);
                setFileKo(null);
              }}
            />
            {previewKo ? (
              <img src={previewKo} alt="" className="mt-2 max-h-32 object-contain rounded border bg-white" />
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-800">영문 이미지 (선택)</p>
        <p className="text-xs text-gray-500 -mt-1">
          비우면 영문 사이트에서도 국문 이미지가 표시됩니다.
        </p>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setUploadModeEn("file")} className={modeBtn(uploadModeEn === "file")}>
            파일 업로드
          </button>
          <button type="button" onClick={() => setUploadModeEn("url")} className={modeBtn(uploadModeEn === "url")}>
            URL 입력
          </button>
        </div>
        {uploadModeEn === "file" ? (
          <div
            onClick={() => fileEnRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#000081]"
          >
            {previewEn ? (
              <img src={previewEn} alt="" className="mx-auto max-h-40 object-contain rounded" />
            ) : (
              <p className="text-gray-400 text-sm py-4">클릭하여 영문용 이미지 선택</p>
            )}
            <input
              ref={fileEnRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFileEn(f);
                setPreviewEn(URL.createObjectURL(f));
                setForm((p) => ({ ...p, image_url_en: "" }));
              }}
            />
          </div>
        ) : (
          <div>
            <input
              type="url"
              className="input"
              placeholder="https://... (영문 배너 URL)"
              value={form.image_url_en}
              onChange={(e) => {
                setForm((p) => ({ ...p, image_url_en: e.target.value }));
                setPreviewEn(e.target.value);
                setFileEn(null);
              }}
            />
            {previewEn ? (
              <img src={previewEn} alt="" className="mt-2 max-h-32 object-contain rounded border" />
            ) : null}
          </div>
        )}
      </div>

      <div>
        <label className="label">표시 순서</label>
        <input
          type="number"
          className="input w-28"
          min={0}
          value={form.sort_order}
          onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
        />
        <p className="text-xs text-gray-400 mt-1">작을수록 먼저 노출. 메인에는 활성 항목 최대 3개까지 순서대로 표시됩니다.</p>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={!validKo || isPending}
          onClick={() => onSubmit(form, { ko: fileKo, en: fileEn })}
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

function RollingSlideRow({
  slide,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onToggle,
  onDelete,
  onEdit,
}: {
  slide: HomeRollingSlide;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-4 p-4 rounded-xl border",
        slide.is_active ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50 opacity-60"
      )}
    >
      <div className="flex gap-1 shrink-0">
        <div className="w-[4.5rem] h-16 rounded-lg overflow-hidden bg-gray-100 border relative">
          {slide.image_url ? (
            <img src={slide.image_url} alt="" className="w-full h-full object-contain" title="국문" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">국문</div>
          )}
          <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-[9px] text-white text-center py-0.5">KO</span>
        </div>
        <div className="w-[4.5rem] h-16 rounded-lg overflow-hidden bg-gray-100 border relative">
          {(slide.image_url_en ?? "").trim() ? (
            <img src={slide.image_url_en!} alt="" className="w-full h-full object-contain" title="영문" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 px-1 text-center leading-tight">
              국문과 동일
            </div>
          )}
          <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-[9px] text-white text-center py-0.5">EN</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 text-sm text-gray-600">
        순서 {slide.sort_order}
        <span className={clsx("badge text-xs ml-2", slide.is_active ? "badge-navy" : "badge-gray")}>
          {slide.is_active ? "활성" : "비활성"}
        </span>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="w-7 h-7 rounded border text-xs disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="w-7 h-7 rounded border text-xs disabled:opacity-30"
          >
            ▼
          </button>
        </div>
        <button type="button" onClick={onToggle} className="text-xs px-2 py-1 rounded border">
          {slide.is_active ? "숨기기" : "표시"}
        </button>
        <button type="button" onClick={onEdit} className="text-xs px-2 py-1 rounded border text-blue-600">
          수정
        </button>
        <button type="button" onClick={onDelete} className="text-xs px-2 py-1 rounded border text-red-600">
          삭제
        </button>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export function VisualPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rollingEditingId, setRollingEditingId] = useState<string | null>(null);
  const [showRollingForm, setShowRollingForm] = useState(false);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: visualService.getAllSlides,
  });

  const { data: rollingSlides = [] } = useQuery({
    queryKey: QUERY_KEY_ROLLING,
    queryFn: homeRollingService.getAllSlides,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const invalidateRolling = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY_ROLLING });
    queryClient.invalidateQueries({ queryKey: ["home-rolling-slides"] });
  };

  /* 생성 */
  const createMut = useMutation({
    mutationFn: async ({ form, file }: { form: FormState; file: File | null }) => {
      let image_url = form.image_url;
      if (file) image_url = await visualService.uploadImage(file);
      await visualService.createSlide({
        image_url,
        main_text: form.main_text,
        main_text_en: form.main_text_en.trim() || null,
        sub_text: form.sub_text.trim() || null,
        sub_text_en: form.sub_text_en.trim() || null,
        sort_order: form.sort_order,
      });
    },
    onSuccess: () => { invalidate(); setShowForm(false); },
    onError: (e: Error) => alert(`등록 실패: ${e.message}`),
  });

  /* 수정 */
  const updateMut = useMutation({
    mutationFn: async ({ id, form, file }: { id: string; form: FormState; file: File | null }) => {
      let image_url = form.image_url;
      if (file) image_url = await visualService.uploadImage(file);
      await visualService.updateSlide(id, {
        image_url,
        main_text: form.main_text,
        main_text_en: form.main_text_en.trim() || null,
        sub_text: form.sub_text.trim() || null,
        sub_text_en: form.sub_text_en.trim() || null,
        sort_order: form.sort_order,
      });
    },
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError: (e: Error) => alert(`수정 실패: ${e.message}`),
  });

  /* 토글 */
  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      visualService.updateSlide(id, { is_active }),
    onSuccess: invalidate,
  });

  /* 삭제 */
  const deleteMut = useMutation({
    mutationFn: async (slide: HeroSlide) => {
      await visualService.deleteSlide(slide.id);
      await visualService.deleteImage(slide.image_url);
    },
    onSuccess: invalidate,
    onError: (e: Error) => alert(`삭제 실패: ${e.message}`),
  });

  /* 순서 이동 */
  const move = (index: number, dir: -1 | 1) => {
    const next = [...slides];
    const target = next[index + dir];
    if (!target) return;
    const updates = [
      { id: next[index].id, sort_order: target.sort_order },
      { id: target.id, sort_order: next[index].sort_order },
    ];
    visualService.reorderSlides(updates).then(invalidate);
  };

  const createRollingMut = useMutation({
    mutationFn: async ({ form, files }: { form: RollingFormState; files: RollingImageFiles }) => {
      let image_url = form.image_url;
      if (files.ko) image_url = await homeRollingService.uploadImage(files.ko);
      let image_url_en: string | null = form.image_url_en.trim() || null;
      if (files.en) image_url_en = await homeRollingService.uploadImage(files.en);
      await homeRollingService.createSlide({
        image_url,
        image_url_en,
        sort_order: form.sort_order,
      });
    },
    onSuccess: () => {
      invalidateRolling();
      setShowRollingForm(false);
    },
    onError: (e: Error) => alert(`등록 실패: ${e.message}`),
  });

  const updateRollingMut = useMutation({
    mutationFn: async ({
      id,
      prev,
      form,
      files,
    }: {
      id: string;
      prev: HomeRollingSlide;
      form: RollingFormState;
      files: RollingImageFiles;
    }) => {
      let image_url = form.image_url;
      if (files.ko) {
        await homeRollingService.deleteImage(prev.image_url);
        image_url = await homeRollingService.uploadImage(files.ko);
      }
      let image_url_en: string | null = form.image_url_en.trim() || null;
      if (files.en) {
        if (prev.image_url_en) await homeRollingService.deleteImage(prev.image_url_en);
        image_url_en = await homeRollingService.uploadImage(files.en);
      } else if (!image_url_en && prev.image_url_en) {
        await homeRollingService.deleteImage(prev.image_url_en);
      }
      await homeRollingService.updateSlide(id, {
        image_url,
        image_url_en,
        sort_order: form.sort_order,
      });
    },
    onSuccess: () => {
      invalidateRolling();
      setRollingEditingId(null);
    },
    onError: (e: Error) => alert(`수정 실패: ${e.message}`),
  });

  const toggleRollingMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      homeRollingService.updateSlide(id, { is_active }),
    onSuccess: invalidateRolling,
  });

  const deleteRollingMut = useMutation({
    mutationFn: async (slide: HomeRollingSlide) => {
      await homeRollingService.deleteSlide(slide.id);
      await homeRollingService.deleteImage(slide.image_url);
      if (slide.image_url_en) await homeRollingService.deleteImage(slide.image_url_en);
    },
    onSuccess: invalidateRolling,
    onError: (e: Error) => alert(`삭제 실패: ${e.message}`),
  });

  const moveRolling = (index: number, dir: -1 | 1) => {
    const next = [...rollingSlides];
    const target = next[index + dir];
    if (!target) return;
    const updates = [
      { id: next[index].id, sort_order: target.sort_order },
      { id: target.id, sort_order: next[index].sort_order },
    ];
    homeRollingService.reorderSlides(updates).then(invalidateRolling);
  };

  if (isLoading && !slides.length) return <PageSpinner />;

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">비주얼 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            메인 히어로는 활성 슬라이드 중 정렬 순서 기준 상위 4개를 사용합니다. 각 슬라이드의 국·영문 문구를 넣으면 메인·타임라인에 반영되고, 비어 있으면 사이트 기본 카피가 쓰입니다.
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setEditingId(null); }}
          className="btn btn-primary"
        >
          {showForm ? "닫기" : "+ 새 슬라이드 추가"}
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="card p-5 mb-6 border-2 border-[#000081]/20">
          <h2 className="text-base font-bold text-gray-800 mb-4">새 슬라이드 등록</h2>
          <SlideForm
            initial={{ ...emptyForm, sort_order: slides.length }}
            onSubmit={(form, file) => createMut.mutate({ form, file })}
            onCancel={() => setShowForm(false)}
            isPending={createMut.isPending}
            submitLabel="등록"
          />
        </div>
      )}

      {/* 슬라이드 목록 */}
      <div className="space-y-3">
        {slides.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p className="text-lg mb-1">등록된 슬라이드가 없습니다.</p>
            <p className="text-sm">위 버튼을 눌러 첫 번째 슬라이드를 추가하세요.</p>
          </div>
        ) : (
          slides.map((slide, i) => (
            <div key={slide.id}>
              {editingId === slide.id ? (
                <div className="card p-5 border-2 border-blue-200">
                  <h2 className="text-sm font-bold text-gray-700 mb-4">슬라이드 수정</h2>
                  <SlideForm
                    initial={{
                      main_text: slide.main_text,
                      main_text_en: slide.main_text_en ?? "",
                      sub_text: slide.sub_text ?? "",
                      sub_text_en: slide.sub_text_en ?? "",
                      image_url: slide.image_url,
                      sort_order: slide.sort_order,
                    }}
                    onSubmit={(form, file) =>
                      updateMut.mutate({ id: slide.id, form, file })
                    }
                    onCancel={() => setEditingId(null)}
                    isPending={updateMut.isPending}
                    submitLabel="수정 저장"
                  />
                </div>
              ) : (
                <SlideRow
                  slide={slide}
                  index={i}
                  total={slides.length}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  onToggle={() => toggleMut.mutate({ id: slide.id, is_active: !slide.is_active })}
                  onDelete={() => {
                    if (confirm("이 슬라이드를 삭제하시겠습니까?"))
                      deleteMut.mutate(slide);
                  }}
                  onEdit={() => { setEditingId(slide.id); setShowForm(false); }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {slides.length > 0 && (
        <p className="text-xs text-gray-400 mt-4">
          총 {slides.length}개 슬라이드 · 활성 {slides.filter((s) => s.is_active).length}개 중 앞에서부터 최대 4개 이미지가 메인 히어로에 연결됩니다.
        </p>
      )}

      <hr className="my-14 border-gray-200" />

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">메인 롤링 이미지 (히어로 바로 아래)</h2>
        <p className="text-sm text-gray-500 mt-1">
          흰색 배경 영역에 순서대로 최대 3장이 자동 전환됩니다. 국문·영문 이미지를 각각 등록하면 언어 전환 시 맞는 배너가 보이고, 영문만 비우면 국문 이미지가 그대로 쓰입니다. <code>hero-images</code> 버킷에 업로드됩니다.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowRollingForm((v) => !v);
            setRollingEditingId(null);
          }}
          className="btn btn-primary mt-4"
        >
          {showRollingForm ? "닫기" : "+ 롤링 이미지 추가"}
        </button>
      </div>

      {showRollingForm && (
        <div className="card p-5 mb-6 border-2 border-[#000081]/15">
          <h3 className="text-base font-bold text-gray-800 mb-4">롤링 이미지 등록</h3>
          <RollingImageForm
            initial={{ image_url: "", image_url_en: "", sort_order: rollingSlides.length }}
            onSubmit={(form, files) => createRollingMut.mutate({ form, files })}
            onCancel={() => setShowRollingForm(false)}
            isPending={createRollingMut.isPending}
            submitLabel="등록"
          />
        </div>
      )}

      <div className="space-y-3">
        {rollingSlides.length === 0 ? (
          <p className="text-sm text-gray-400">등록된 롤링 이미지가 없습니다. 메인 해당 영역은 비어 있습니다.</p>
        ) : (
          rollingSlides.map((rs, i) => (
            <div key={rs.id}>
              {rollingEditingId === rs.id ? (
                <div className="card p-5 border-2 border-blue-200">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">롤링 이미지 수정</h3>
                  <RollingImageForm
                    initial={{
                      image_url: rs.image_url,
                      image_url_en: rs.image_url_en ?? "",
                      sort_order: rs.sort_order,
                    }}
                    onSubmit={(form, files) =>
                      updateRollingMut.mutate({ id: rs.id, prev: rs, form, files })
                    }
                    onCancel={() => setRollingEditingId(null)}
                    isPending={updateRollingMut.isPending}
                    submitLabel="저장"
                  />
                </div>
              ) : (
                <RollingSlideRow
                  slide={rs}
                  index={i}
                  total={rollingSlides.length}
                  onMoveUp={() => moveRolling(i, -1)}
                  onMoveDown={() => moveRolling(i, 1)}
                  onToggle={() =>
                    toggleRollingMut.mutate({ id: rs.id, is_active: !rs.is_active })
                  }
                  onDelete={() => {
                    if (confirm("이 롤링 이미지를 삭제할까요?")) deleteRollingMut.mutate(rs);
                  }}
                  onEdit={() => {
                    setRollingEditingId(rs.id);
                    setShowRollingForm(false);
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
