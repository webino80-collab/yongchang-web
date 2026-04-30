import { supabase } from "@/lib/supabaseClient";
import type { Database } from "@/lib/database.types";
import type { AssetRenewal } from "@/types";

export type AssetRenewalInput = Omit<
  AssetRenewal,
  "id" | "created_at" | "updated_at" | "last_notified_at"
> & {
  last_notified_at?: string | null;
};

type AssetRenewalInsert = Database["public"]["Tables"]["asset_renewals"]["Insert"];
type AssetRenewalUpdate = Database["public"]["Tables"]["asset_renewals"]["Update"];

function normalizeCreateInput(input: AssetRenewalInput): AssetRenewalInsert {
  return {
    asset_type: input.asset_type,
    asset_name: String(input.asset_name).trim(),
    provider: String(input.provider ?? "").trim() || null,
    target: String(input.target ?? "").trim() || null,
    expires_at: input.expires_at,
    notify_days_before: Number(input.notify_days_before ?? 14),
    notify_email: String(input.notify_email ?? "").trim() || "jmpapa@kakao.com",
    is_active: input.is_active ?? true,
    notes: String(input.notes ?? "").trim() || null,
    last_notified_at: input.last_notified_at ?? null,
  };
}

function normalizeUpdateInput(input: Partial<AssetRenewalInput>): AssetRenewalUpdate {
  const out: AssetRenewalUpdate = {};
  if (input.asset_type !== undefined) out.asset_type = input.asset_type;
  if (input.asset_name !== undefined) out.asset_name = String(input.asset_name).trim();
  if (input.provider !== undefined) out.provider = String(input.provider ?? "").trim() || null;
  if (input.target !== undefined) out.target = String(input.target ?? "").trim() || null;
  if (input.expires_at !== undefined) out.expires_at = input.expires_at;
  if (input.notify_days_before !== undefined) out.notify_days_before = Number(input.notify_days_before);
  if (input.notify_email !== undefined) out.notify_email = String(input.notify_email).trim() || "jmpapa@kakao.com";
  if (input.is_active !== undefined) out.is_active = input.is_active;
  if (input.notes !== undefined) out.notes = String(input.notes ?? "").trim() || null;
  if (input.last_notified_at !== undefined) out.last_notified_at = input.last_notified_at;
  return out;
}

export const assetRenewalService = {
  async list(): Promise<AssetRenewal[]> {
    const { data, error } = await supabase
      .from("asset_renewals")
      .select("*")
      .order("expires_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AssetRenewal[];
  },

  async create(input: AssetRenewalInput): Promise<AssetRenewal> {
    const payload = normalizeCreateInput(input);
    const { data, error } = await supabase
      .from("asset_renewals")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as AssetRenewal;
  },

  async update(id: string, input: Partial<AssetRenewalInput>): Promise<AssetRenewal> {
    const payload = normalizeUpdateInput(input);
    const { data, error } = await supabase
      .from("asset_renewals")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as AssetRenewal;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("asset_renewals").delete().eq("id", id);
    if (error) throw error;
  },

  async sendDueAlertsNow(): Promise<void> {
    const { error } = await supabase.functions.invoke("send-renewal-alerts", { body: {} });
    if (error) throw error;
  },
};

