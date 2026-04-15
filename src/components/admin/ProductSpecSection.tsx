import { Fragment, type Dispatch, type SetStateAction } from "react";
import type { GccPlusSpecRow, GccPlusSpecTable, Product, ProductSpecRow } from "@/types";
import { SPEC_TYPE_OPTIONS } from "@/pages/admin/productAdminConstants";
import {
  SPEC_SUBTYPE_OPTIONS,
  defaultGccPlusTables,
  specCellValue,
  specColumnsForSubtype,
} from "@/lib/productSpecLayouts";

export type ProductForm = Omit<Product, "id" | "created_at">;

type Props = {
  form: ProductForm;
  setForm: Dispatch<SetStateAction<ProductForm>>;
  specSelected: Set<number>;
  toggleSpecRow: (i: number) => void;
  addSpecRows: () => void;
  deleteSelectedSpecRows: () => void;
  updateSpecRow: (i: number, patch: Partial<ProductSpecRow>) => void;
};

function ColorInputs({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const safe = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#cccccc";
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="h-8 w-10 cursor-pointer rounded border border-gray-200 p-0"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="input flex-1 text-xs py-1 min-w-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#RRGGBB"
      />
    </div>
  );
}

export function ProductSpecSection({
  form,
  setForm,
  specSelected,
  toggleSpecRow,
  addSpecRows,
  deleteSelectedSpecRows,
  updateSpecRow,
}: Props) {
  const st = form.spec_subtype ?? "gcl";
  const isGccPlus = st === "gcc_plus";
  const columns = specColumnsForSubtype(st);

  const gccTables: GccPlusSpecTable[] =
    form.spec_gcc_plus_tables?.length ? form.spec_gcc_plus_tables : defaultGccPlusTables();

  function patchGccRow(tableIdx: number, rowIdx: number, patch: Partial<GccPlusSpecRow>) {
    setForm((p) => {
      const tables = (p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables()).map((t, ti) =>
        ti === tableIdx
          ? {
              ...t,
              rows: t.rows.map((row, ri) => (ri === rowIdx ? { ...row, ...patch } : row)),
            }
          : t
      );
      return { ...p, spec_gcc_plus_tables: tables };
    });
  }

  function addGccRow(tableIdx: number) {
    setForm((p) => {
      const tables = (p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables()).map((t, ti) =>
        ti === tableIdx ? { ...t, rows: [...t.rows, { gauge: "", color_hex: "#cccccc", length: "" }] } : t
      );
      return { ...p, spec_gcc_plus_tables: tables };
    });
  }

  function removeGccRow(tableIdx: number, rowIdx: number) {
    setForm((p) => {
      const base = p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables();
      const tables = base.map((t, ti) =>
        ti === tableIdx
          ? { ...t, rows: t.rows.filter((_, ri) => ri !== rowIdx).length ? t.rows.filter((_, ri) => ri !== rowIdx) : [{ gauge: "", color_hex: "#cccccc", length: "" }] }
          : t
      );
      return { ...p, spec_gcc_plus_tables: tables };
    });
  }

  function patchGccTableTitle(tableIdx: number, patch: Partial<Pick<GccPlusSpecTable, "title_ko" | "title_en">>) {
    setForm((p) => {
      const tables = (p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables()).map((t, ti) =>
        ti === tableIdx ? { ...t, ...patch } : t
      );
      return { ...p, spec_gcc_plus_tables: tables };
    });
  }

  return (
    <>
      <p className="text-sm font-medium text-gray-800 mb-2">서브 구분</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
        {SPEC_SUBTYPE_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="spec_subtype"
              checked={st === opt.value}
              onChange={() =>
                setForm((p) => ({
                  ...p,
                  spec_subtype: opt.value,
                  ...(opt.value === "gcc_plus"
                    ? {
                        spec_gcc_plus_tables: p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables(),
                      }
                    : {}),
                }))
              }
            />
            {opt.label}
          </label>
        ))}
      </div>

      {isGccPlus ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GCC+ 상단 안내 (국문)</label>
              <textarea
                className="input w-full min-h-[5rem] resize-y text-sm"
                value={form.spec_gcc_plus_intro_ko ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, spec_gcc_plus_intro_ko: e.target.value || null }))}
                placeholder="표 위에 표시할 설명을 입력하세요."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GCC+ 상단 안내 (영문)</label>
              <textarea
                className="input w-full min-h-[5rem] resize-y text-sm"
                value={form.spec_gcc_plus_intro_en ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, spec_gcc_plus_intro_en: e.target.value || null }))}
                placeholder="English text above tables."
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-center">
            {gccTables.map((tbl, ti) => (
              <Fragment key={ti}>
                {ti > 0 ? (
                  <div
                    className="hidden shrink-0 select-none items-center justify-center self-stretch pt-10 text-2xl font-light text-gray-400 lg:flex"
                    aria-hidden
                  >
                    +
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 rounded-lg border border-gray-200 overflow-hidden bg-white">
                <div className="bg-gray-100 px-3 py-2 border-b border-gray-200 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    className="input text-sm font-semibold"
                    value={tbl.title_ko}
                    onChange={(e) => patchGccTableTitle(ti, { title_ko: e.target.value })}
                    placeholder="표 제목 (국문)"
                  />
                  <input
                    className="input text-sm"
                    value={tbl.title_en}
                    onChange={(e) => patchGccTableTitle(ti, { title_en: e.target.value })}
                    placeholder="Table title (EN)"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[280px]">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-2 py-2 text-left font-bold">Gauge</th>
                        <th className="px-2 py-2 text-left font-bold">Color</th>
                        <th className="px-2 py-2 text-left font-bold">Length</th>
                        <th className="px-2 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {tbl.rows.map((row, ri) => (
                        <tr key={ri} className="border-t border-gray-200">
                          <td className="px-2 py-1.5">
                            <input
                              className="input w-full text-xs py-1"
                              value={row.gauge}
                              onChange={(e) => patchGccRow(ti, ri, { gauge: e.target.value })}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <ColorInputs value={row.color_hex} onChange={(hex) => patchGccRow(ti, ri, { color_hex: hex })} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              className="input w-full text-xs py-1"
                              value={row.length}
                              onChange={(e) => patchGccRow(ti, ri, { length: e.target.value })}
                            />
                          </td>
                          <td className="px-1 py-1.5 text-right">
                            <button
                              type="button"
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => removeGccRow(ti, ri)}
                              disabled={tbl.rows.length <= 1}
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-2 py-2 border-t border-gray-100 flex justify-end">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => addGccRow(ti)}>
                    + 행 추가
                  </button>
                </div>
                </div>
              </Fragment>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setForm((p) => {
                  const t = p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables();
                  return {
                    ...p,
                    spec_gcc_plus_tables: [
                      ...t,
                      { title_ko: "표", title_en: "Table", rows: [{ gauge: "", color_hex: "#cccccc", length: "" }] },
                    ],
                  };
                })
              }
            >
              + 표 추가
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm text-red-700"
              disabled={gccTables.length <= 1}
              onClick={() =>
                setForm((p) => {
                  const t = p.spec_gcc_plus_tables?.length ? p.spec_gcc_plus_tables : defaultGccPlusTables();
                  if (t.length <= 1) return p;
                  return { ...p, spec_gcc_plus_tables: t.slice(0, -1) };
                })
              }
            >
              마지막 표 삭제
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table
              className={`w-full text-sm ${
                columns.length >= 6 ? "min-w-[920px]" : columns.length >= 4 ? "min-w-[720px]" : "min-w-[520px]"
              }`}
            >
              <thead className="bg-gray-100 text-slate-700">
                <tr>
                  <th className="px-2 py-2 w-10 text-center">
                    <span className="sr-only">선택</span>
                  </th>
                  {columns.map((col) => (
                    <th key={col.field} className="px-2 py-2 text-left font-bold">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.spec_rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={specSelected.has(i)}
                        onChange={() => toggleSpecRow(i)}
                        aria-label={`행 ${i + 1} 선택`}
                      />
                    </td>
                    {columns.map((col) => (
                      <td key={col.field} className="px-2 py-2">
                        {col.kind === "color" ? (
                          <ColorInputs
                            value={specCellValue(row, col.field)}
                            onChange={(hex) => updateSpecRow(i, { [col.field]: hex } as Partial<ProductSpecRow>)}
                          />
                        ) : col.kind === "type" ? (
                          <select
                            className="input w-full text-xs py-1"
                            value={specCellValue(row, col.field)}
                            onChange={(e) => updateSpecRow(i, { [col.field]: e.target.value } as Partial<ProductSpecRow>)}
                          >
                            {specCellValue(row, col.field) &&
                            !(SPEC_TYPE_OPTIONS as readonly string[]).includes(specCellValue(row, col.field)) ? (
                              <option value={specCellValue(row, col.field)}>{specCellValue(row, col.field)}</option>
                            ) : null}
                            {SPEC_TYPE_OPTIONS.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="input w-full text-xs py-1"
                            value={specCellValue(row, col.field)}
                            onChange={(e) => updateSpecRow(i, { [col.field]: e.target.value } as Partial<ProductSpecRow>)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {form.spec_rows.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">규격 행이 없습니다. 항목 추가를 눌러 주세요.</p>
          )}
          <div className="flex flex-wrap justify-end gap-2 mt-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={addSpecRows}>
              항목 추가
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm text-red-700"
              onClick={deleteSelectedSpecRows}
              disabled={specSelected.size === 0}
            >
              선택 삭제
            </button>
          </div>
        </>
      )}
    </>
  );
}
