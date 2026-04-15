import type { GccPlusSpecTable, ProductSpecRow } from "@/types";

/** 서브 구분 (DB `products.spec_subtype`) — 표시 순서 */
export const SPEC_SUBTYPE_OPTIONS = [
  { value: "gcl", label: "GCL" },
  { value: "gcli", label: "GCLI" },
  { value: "gclp", label: "GCLP" },
  { value: "mgcct", label: "MGCCT" },
  { value: "cagl", label: "CaGL" },
  { value: "gcc_plus", label: "GCC+" },
  { value: "mgcli", label: "MGCLI" },
  { value: "cl", label: "CL" },
  { value: "cgl", label: "CGL" },
] as const;

export type ProductSpecSubtype = (typeof SPEC_SUBTYPE_OPTIONS)[number]["value"];

const NEW_SUBTYPE_SET = new Set<string>(SPEC_SUBTYPE_OPTIONS.map((o) => o.value));

/** 이전 서브구분 → 신규 코드 (불러온 뒤 표시·저장 시 신규값으로 정규화) */
export const LEGACY_SPEC_SUBTYPE_MAP: Record<string, ProductSpecSubtype> = {
  general: "gcli",
  cannula_line: "gcli",
  meso: "gcli",
  sterile: "gcl",
  pen: "gcli",
  anesthesia: "mgcct",
  syringe: "gcl",
  other: "gcl",
};

export function normalizeSpecSubtype(raw: string | null | undefined): ProductSpecSubtype {
  const t = String(raw ?? "").trim();
  const lower = t.toLowerCase();
  if (LEGACY_SPEC_SUBTYPE_MAP[t]) return LEGACY_SPEC_SUBTYPE_MAP[t];
  if (LEGACY_SPEC_SUBTYPE_MAP[lower]) return LEGACY_SPEC_SUBTYPE_MAP[lower];
  if (NEW_SUBTYPE_SET.has(lower)) return lower as ProductSpecSubtype;
  return "gcl";
}

export type SpecColumnKind = "text" | "color" | "type";

export type SpecColumnDef = {
  field: keyof ProductSpecRow;
  header: string;
  kind: SpecColumnKind;
};

const GCC_DEFAULT_TITLES: [string, string] = ["Filler Cannula", "Punching Needle"];

export function defaultGccPlusTables(): GccPlusSpecTable[] {
  const row = () => ({ gauge: "", color_hex: "#cccccc", length: "" });
  return GCC_DEFAULT_TITLES.map((title) => ({
    title_ko: title,
    title_en: title,
    rows: [row()],
  }));
}

export function normalizeGccPlusTables(raw: unknown): GccPlusSpecTable[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: GccPlusSpecTable[] = [];
  for (const t of raw) {
    if (t == null || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    const title_ko = String(o.title_ko ?? "");
    const title_en = String(o.title_en ?? "");
    const rowsRaw = Array.isArray(o.rows) ? o.rows : [];
    const rows = rowsRaw
      .filter((r) => r != null && typeof r === "object")
      .map((r) => {
        const x = r as Record<string, unknown>;
        return {
          gauge: String(x.gauge ?? ""),
          color_hex: String(x.color_hex ?? x.color ?? "#cccccc"),
          length: String(x.length ?? ""),
        };
      });
    if (title_ko || title_en || rows.length) {
      out.push({
        title_ko: title_ko || "표",
        title_en: title_en || title_ko || "Table",
        rows: rows.length ? rows : [{ gauge: "", color_hex: "#cccccc", length: "" }],
      });
    }
  }
  return out.length ? out : null;
}

/** 단일 표 규격 열 정의 (GCC+ 제외) */
export function specColumnsForSubtype(subtype: string | null | undefined): SpecColumnDef[] {
  const s = normalizeSpecSubtype(subtype);
  switch (s) {
    case "gcl":
      return [
        { field: "gauge", header: "Gauge", kind: "text" },
        { field: "color_hex", header: "Color", kind: "color" },
        { field: "length", header: "Length", kind: "text" },
      ];
    case "gcli":
      return [
        { field: "gauge", header: "Gauge", kind: "text" },
        { field: "color_hex", header: "Color", kind: "color" },
        { field: "length", header: "Length", kind: "text" },
        { field: "wall_type", header: "Type", kind: "type" },
        { field: "measurement", header: "Size (ø etc.)", kind: "text" },
      ];
    case "gclp":
      return [
        { field: "gauge", header: "Gauge", kind: "text" },
        { field: "color_hex", header: "Color", kind: "color" },
        { field: "length", header: "Length", kind: "text" },
        { field: "pin", header: "Pin", kind: "text" },
      ];
    case "mgcct":
      return [
        { field: "model", header: "Model", kind: "text" },
        { field: "gauge", header: "Gauge", kind: "text" },
        { field: "color_hex", header: "Color", kind: "color" },
        { field: "cannula_size", header: "Cannula Size", kind: "text" },
        { field: "tube_length", header: "Tube Length", kind: "text" },
        { field: "safety_type", header: "Safety Type", kind: "text" },
      ];
    case "cagl":
      return [
        { field: "cannula", header: "Cannula", kind: "text" },
        { field: "gauge", header: "Gauge", kind: "text" },
        { field: "length", header: "Length", kind: "text" },
      ];
    case "mgcli":
      return [
        { field: "model", header: "Model", kind: "text" },
        { field: "color_hex", header: "Color", kind: "color" },
        { field: "length", header: "Length", kind: "text" },
        { field: "wall_type", header: "Type", kind: "type" },
        { field: "measurement", header: "Size (ø etc.)", kind: "text" },
      ];
    case "cl":
      return [
        { field: "capacity", header: "Capacity", kind: "text" },
        { field: "length", header: "Length", kind: "text" },
      ];
    case "cgl":
      return [
        { field: "capacity", header: "Capacity", kind: "text" },
        { field: "gauge", header: "Gauge", kind: "text" },
        { field: "length", header: "Length", kind: "text" },
      ];
    case "gcc_plus":
      return [];
    default:
      return specColumnsForSubtype("gcl");
  }
}

export function specCellValue(row: ProductSpecRow, field: keyof ProductSpecRow): string {
  const v = row[field];
  return typeof v === "string" ? v : "";
}
