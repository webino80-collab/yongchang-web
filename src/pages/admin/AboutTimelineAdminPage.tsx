import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aboutTimelineService } from "@/lib/aboutTimelineService";
import { DEFAULT_ABOUT_TIMELINE_ITEMS } from "@/lib/aboutTimelineDefaults";
import { PageSpinner } from "@/components/ui/Spinner";
import type { AboutTimelineEvent, AboutTimelineYear } from "@/types";

function emptyEvent(): AboutTimelineEvent {
  return { date: "", ko: "", en: "" };
}

function emptyYear(): AboutTimelineYear {
  return { year: "", img_path: null, events: [emptyEvent()] };
}

function sanitizeForSave(items: AboutTimelineYear[]): AboutTimelineYear[] {
  return items
    .map((y) => ({
      year: y.year.trim(),
      img_path: y.img_path?.trim() || null,
      events: y.events
        .map((e) => ({
          date: e.date.trim(),
          ko: e.ko.trim(),
          en: e.en.trim(),
        }))
        .filter((e) => e.date || e.ko || e.en),
    }))
    .filter((y) => y.year.length > 0);
}

export function AboutTimelineAdminPage() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<AboutTimelineYear[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-about-timeline"],
    queryFn: () => aboutTimelineService.getAdminItems(),
  });

  useEffect(() => {
    if (data) setItems(structuredClone(data));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: AboutTimelineYear[]) => aboutTimelineService.saveItems(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-about-timeline"] });
      queryClient.invalidateQueries({ queryKey: ["about-timeline-public"] });
      alert("저장되었습니다.");
    },
    onError: (e: Error) => {
      alert(e.message || "저장에 실패했습니다.");
    },
  });

  function handleResetToCodeDefaults() {
    if (!confirm("코드에 내장된 초기 연혁으로 되돌릴까요? (저장은 별도로 눌러야 반영됩니다)")) return;
    setItems(structuredClone(DEFAULT_ABOUT_TIMELINE_ITEMS));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = sanitizeForSave(items);
    if (next.length === 0) {
      alert("최소 한 개 이상의 연도(연도 텍스트 입력)가 필요합니다.");
      return;
    }
    saveMutation.mutate(next);
  }

  function setYear(i: number, patch: Partial<AboutTimelineYear>) {
    setItems((prev) => prev.map((y, j) => (j === i ? { ...y, ...patch } : y)));
  }

  function setEvent(yi: number, ei: number, patch: Partial<AboutTimelineEvent>) {
    setItems((prev) =>
      prev.map((y, j) =>
        j === yi
          ? {
              ...y,
              events: y.events.map((ev, k) => (k === ei ? { ...ev, ...patch } : ev)),
            }
          : y
      )
    );
  }

  function addYear() {
    setItems((prev) => [...prev, emptyYear()]);
  }

  function removeYear(i: number) {
    setItems((prev) => prev.filter((_, j) => j !== i));
  }

  function addEvent(yi: number) {
    setItems((prev) =>
      prev.map((y, j) => (j === yi ? { ...y, events: [...y.events, emptyEvent()] } : y))
    );
  }

  function removeEvent(yi: number, ei: number) {
    setItems((prev) =>
      prev.map((y, j) =>
        j === yi ? { ...y, events: y.events.filter((_, k) => k !== ei) } : y
      )
    );
  }

  function moveYear(from: number, dir: -1 | 1) {
    const to = from + dir;
    setItems((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const copy = [...prev];
      const [row] = copy.splice(from, 1);
      copy.splice(to, 0, row);
      return copy;
    });
  }

  if (isLoading && !data) return <PageSpinner />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About 연혁 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            회사소개 페이지의「우리가 걸어온 길」타임라인입니다. 연도별로 국문·영문을 한 화면에서 수정한 뒤 하단의 저장을 누르세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-about-timeline"] })}>
            서버에서 다시 불러오기
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetToCodeDefaults}>
            초기값으로 되돌리기
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {items.map((block, yi) => (
          <div key={`year-${yi}`} className="card p-5 border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-800">연도 블록 {yi + 1}</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveYear(yi, -1)} disabled={yi === 0}>
                  ↑ 위로
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveYear(yi, 1)} disabled={yi === items.length - 1}>
                  ↓ 아래로
                </button>
                <button type="button" className="btn btn-secondary btn-sm text-red-700 border-red-200" onClick={() => removeYear(yi)}>
                  연도 삭제
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연도 (표시)</label>
                <input
                  className="input w-full"
                  value={block.year}
                  onChange={(e) => setYear(yi, { year: e.target.value })}
                  placeholder="예: 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이미지 경로 (선택)</label>
                <input
                  className="input w-full"
                  value={block.img_path ?? ""}
                  onChange={(e) => setYear(yi, { img_path: e.target.value || null })}
                  placeholder="예: brand/2024_products.png 또는 https://..."
                />
                <p className="text-xs text-gray-400 mt-1">상대 경로는 사이트 이미지 베이스 URL 뒤에 붙습니다.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">이벤트 (날짜 · 국문 · 영문)</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => addEvent(yi)}>
                  + 이벤트 추가
                </button>
              </div>

              <div className="hidden md:grid grid-cols-[9rem_1fr_1fr_3.5rem] gap-2 text-xs font-medium text-gray-500 px-1 mb-1">
                <span>날짜</span>
                <span>국문</span>
                <span>영문</span>
                <span />
              </div>

              <div className="space-y-3">
                {block.events.map((ev, ei) => (
                  <div
                    key={`${yi}-ev-${ei}`}
                    className="grid grid-cols-1 md:grid-cols-[9rem_1fr_1fr_3.5rem] gap-2 items-start"
                  >
                    <input
                      className="input w-full"
                      value={ev.date}
                      onChange={(e) => setEvent(yi, ei, { date: e.target.value })}
                      placeholder="2024.02"
                    />
                    <textarea
                      className="input w-full min-h-[4.5rem] py-2 resize-y"
                      value={ev.ko}
                      onChange={(e) => setEvent(yi, ei, { ko: e.target.value })}
                      placeholder="국문 내용"
                      rows={2}
                    />
                    <textarea
                      className="input w-full min-h-[4.5rem] py-2 resize-y"
                      value={ev.en}
                      onChange={(e) => setEvent(yi, ei, { en: e.target.value })}
                      placeholder="English"
                      rows={2}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm text-red-600 shrink-0"
                      onClick={() => removeEvent(yi, ei)}
                      disabled={block.events.length <= 1}
                      title="이벤트 삭제"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-secondary" onClick={addYear}>
          + 연도 블록 추가
        </button>

        <div className="flex flex-wrap items-center gap-3 pt-6 mt-2 border-t border-gray-200">
          <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "저장 중…" : "연혁 저장"}
          </button>
          <span className="text-sm text-gray-500">국문·영문을 한 페이지에서 수정한 뒤 한 번에 등록합니다.</span>
        </div>
      </form>
    </div>
  );
}
