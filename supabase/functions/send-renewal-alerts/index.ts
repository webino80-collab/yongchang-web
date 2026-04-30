/**
 * send-renewal-alerts
 * 매일 1회 호출되어 호스팅/SSL 만료 2주 전(기본) 알림 메일을 보냅니다.
 *
 * 환경변수:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   MAIL_WORKER_URL, MAIL_WORKER_KEY (또는 MAIL_WORKER_SECRET)
 *   SITE_NAME (선택)
 *   RENEWAL_ALERT_TO (선택, 기본: jmpapa@kakao.com)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getMailWorkerBearerToken, getMailWorkerUrl } from "../_shared/mail_worker_env.ts";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

type AssetRenewalRow = {
  id: string;
  asset_type: "hosting" | "ssl";
  asset_name: string;
  provider: string | null;
  target: string | null;
  expires_at: string;
  notify_days_before: number;
  notify_email: string;
  last_notified_at: string | null;
  is_active: boolean;
  notes: string | null;
};

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setUTCDate(n.getUTCDate() + days);
  return n;
}

function diffDays(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / 86_400_000);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailWorkerUrl = getMailWorkerUrl();
    const mailWorkerSecret = getMailWorkerBearerToken();
    const siteName = Deno.env.get("SITE_NAME") ?? "용창";
    const fallbackTo = Deno.env.get("RENEWAL_ALERT_TO") ?? "jmpapa@kakao.com";

    if (!mailWorkerUrl || !mailWorkerSecret) {
      console.error("MAIL_WORKER_URL or MAIL_WORKER_KEY (or MAIL_WORKER_SECRET) not set");
      return new Response("Mail config missing", { status: 500, headers: cors });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("asset_renewals")
      .select(
        "id, asset_type, asset_name, provider, target, expires_at, notify_days_before, notify_email, last_notified_at, is_active, notes",
      )
      .eq("is_active", true);

    if (error) throw error;

    const rows = (data ?? []) as AssetRenewalRow[];
    const today = new Date(`${isoDateOnly(new Date())}T00:00:00.000Z`);

    const due = rows.filter((r) => {
      const expires = new Date(`${r.expires_at}T00:00:00.000Z`);
      const notifyOn = addDays(expires, -Math.max(1, Number(r.notify_days_before || 14)));
      if (today < notifyOn || today > expires) return false;
      if (!r.last_notified_at) return true;
      const last = new Date(r.last_notified_at);
      return last < notifyOn;
    });

    if (due.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, scanned: rows.length }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    for (const r of due) {
      const expires = new Date(`${r.expires_at}T00:00:00.000Z`);
      const daysLeft = diffDays(expires, today);
      const kind = r.asset_type === "ssl" ? "SSL 인증서" : "호스팅";
      const to = r.notify_email?.trim() || fallbackTo;
      const html = `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;">
          <h2 style="margin-bottom:12px;">[${siteName}] ${kind} 갱신 알림</h2>
          <p><strong>${r.asset_name}</strong> 항목의 만료일이 가까워졌습니다.</p>
          <ul>
            <li><strong>유형:</strong> ${kind}</li>
            <li><strong>이름:</strong> ${r.asset_name}</li>
            <li><strong>대상:</strong> ${r.target ?? "-"}</li>
            <li><strong>공급사:</strong> ${r.provider ?? "-"}</li>
            <li><strong>만료일:</strong> ${r.expires_at}</li>
            <li><strong>D-day:</strong> ${daysLeft >= 0 ? `D-${daysLeft}` : "만료 지남"}</li>
          </ul>
          ${r.notes ? `<p><strong>메모:</strong> ${r.notes}</p>` : ""}
          <p style="font-size:12px;color:#666;margin-top:20px;">이 메일은 자동 발송입니다.</p>
        </div>
      `;

      const mailRes = await fetch(mailWorkerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mailWorkerSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to,
          subject: `[${siteName}] ${kind} 갱신 예정 (${r.asset_name}, ${r.expires_at})`,
          html,
        }),
      });

      if (!mailRes.ok) {
        const t = await mailRes.text();
        console.error("mail worker failed:", mailRes.status, t);
        continue;
      }

      const { error: updateErr } = await supabase
        .from("asset_renewals")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", r.id);
      if (updateErr) {
        console.error("failed to update last_notified_at:", updateErr);
      }
    }

    return new Response(JSON.stringify({ ok: true, sent: due.length, scanned: rows.length }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-renewal-alerts error:", err);
    return new Response("Internal Server Error", { status: 500, headers: cors });
  }
});

