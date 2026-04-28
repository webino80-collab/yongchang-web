/**
 * Supabase 프로젝트 비활성(일정 기간 무접속 시 일시 중지 등) 완화용 경량 핑.
 *
 * 외부 크론(예: cron-job.org, UptimeRobot)에서 6~12시간마다 호출:
 *   GET https://<PROJECT_REF>.supabase.co/functions/v1/keep-alive
 *
 * JWT 검증 끔(config.toml) — URL만 알면 호출 가능하므로, 크론 URL은 비공개로 두세요.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!url || !anon) {
    return new Response(JSON.stringify({ ok: false, error: "env" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(url, anon);
  // 공개 읽기 가능한 테이블 1행 조회로 API·DB 연결 유지 (부하 최소)
  const { error } = await supabase.from("site_config").select("key").limit(1);

  return new Response(
    JSON.stringify({ ok: !error, at: new Date().toISOString() }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } },
  );
});
