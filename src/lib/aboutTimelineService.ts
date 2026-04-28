/**
 * About 페이지 연혁 — Supabase `about_timeline` 테이블(id=1 고정 행, `items` jsonb).
 * 마이그레이션: `supabase/migrations/021_about_timeline.sql` 를 프로젝트에 적용하세요.
 */
import { supabase } from "./supabaseClient";
import type { AboutTimelineEvent, AboutTimelineYear } from "@/types";
import { DEFAULT_ABOUT_TIMELINE_ITEMS } from "./aboutTimelineDefaults";

const TIMELINE_ROW_ID = 1 as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseEvent(v: unknown): AboutTimelineEvent | null {
  if (!isRecord(v)) return null;
  const date = typeof v.date === "string" ? v.date.trim() : "";
  const ko = typeof v.ko === "string" ? v.ko : "";
  const en = typeof v.en === "string" ? v.en : "";
  if (!date && !ko && !en) return null;
  return { date, ko, en };
}

function parseYear(v: unknown): AboutTimelineYear | null {
  if (!isRecord(v)) return null;
  const year = typeof v.year === "string" ? v.year.trim() : "";
  if (!year) return null;
  const imgRaw = v.img_path ?? v.img;
  const img_path =
    imgRaw === null || imgRaw === undefined
      ? null
      : typeof imgRaw === "string"
        ? imgRaw.trim() || null
        : null;
  const evArr = Array.isArray(v.events) ? v.events : [];
  const events = evArr.map(parseEvent).filter((e): e is AboutTimelineEvent => e !== null);
  return { year, img_path, events };
}

/** Supabase `items` JSON → 타입 안전 배열 (실패 시 null) */
export function parseTimelineItems(raw: unknown): AboutTimelineYear[] | null {
  if (!Array.isArray(raw)) return null;
  const out: AboutTimelineYear[] = [];
  for (const el of raw) {
    const y = parseYear(el);
    if (y) out.push(y);
  }
  return out.length ? out : null;
}

/** `imgBase` 뒤에 붙는 상대 경로 또는 절대 URL → 표시용 이미지 URL */
export function resolveTimelineImage(img_path: string | null, imgBase: string): string | null {
  const t = img_path?.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  const base = imgBase.replace(/\/+$/, "");
  const path = t.replace(/^\/+/, "");
  return `${base}/${path}`;
}

export const aboutTimelineService = {
  /** 공개 About 페이지용 */
  async getActiveItems(): Promise<AboutTimelineYear[] | null> {
    const { data, error } = await supabase
      .from("about_timeline")
      .select("items")
      .eq("id", TIMELINE_ROW_ID)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[aboutTimelineService] getActiveItems:", error);
      return null;
    }
    return parseTimelineItems(data?.items);
  },

  /** 관리자 편집용 */
  async getAdminItems(): Promise<AboutTimelineYear[]> {
    const { data, error } = await supabase
      .from("about_timeline")
      .select("items")
      .eq("id", TIMELINE_ROW_ID)
      .maybeSingle();

    if (error) {
      console.error("[aboutTimelineService] getAdminItems:", error);
      return structuredClone(DEFAULT_ABOUT_TIMELINE_ITEMS);
    }
    const parsed = parseTimelineItems(data?.items);
    return parsed ?? structuredClone(DEFAULT_ABOUT_TIMELINE_ITEMS);
  },

  async saveItems(items: AboutTimelineYear[]): Promise<void> {
    const { error } = await supabase.from("about_timeline").upsert(
      {
        id: TIMELINE_ROW_ID,
        items,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  },
};
