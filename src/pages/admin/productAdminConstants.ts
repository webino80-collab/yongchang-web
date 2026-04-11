import type { ProductSpecRow } from "@/types";

/** 규격 — 타입 (운영 제품 등록폼과 동일) */
export const SPEC_TYPE_OPTIONS = [
  "I.D.(ETW)",
  "Pin",
  "Inner O.D.",
] as const;

/** 규격 정보 서브 구분(라디오) */
export const SPEC_SUBTYPE_OPTIONS = [
  { value: "general", label: "일반 바늘" },
  { value: "cannula_line", label: "캐뉼라" },
  { value: "meso", label: "메조" },
  { value: "sterile", label: "멸균" },
  { value: "pen", label: "펜니들" },
  { value: "anesthesia", label: "마취" },
  { value: "syringe", label: "주사기" },
  { value: "other", label: "기타" },
] as const;

export function emptySpecRow(): ProductSpecRow {
  return {
    gauge: "",
    length: "",
    color_hex: "#cccccc",
    wall_type: SPEC_TYPE_OPTIONS[0],
    measurement: "",
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
