import type { ProductSpecRow } from "@/types";

/** 규격 — 타입 (운영 제품 등록폼과 동일) */
export const SPEC_TYPE_OPTIONS = [
  "I.D.(ETW)",
  "Pin",
  "Inner O.D.",
] as const;

export function emptySpecRow(): ProductSpecRow {
  return {
    model: "",
    gauge: "",
    length: "",
    color_hex: "#cccccc",
    wall_type: SPEC_TYPE_OPTIONS[0],
    measurement: "",
    pin: "",
    cannula_size: "",
    tube_length: "",
    safety_type: "",
    cannula: "",
    capacity: "",
  };
}

export function fileLabelFromUrl(url: string): string {
  const u = url.trim();
  if (!u) return "";
  try {
    const path = new URL(u).pathname.split("/").pop() ?? u;
    return decodeURIComponent(path);
  } catch {
    return u.slice(-32);
  }
}
