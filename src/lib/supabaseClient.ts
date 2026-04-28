import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}

// 데이터 쿼리에만 10초 타임아웃 (auth 요청 제외)
// AbortController 대신 Promise.race + 일반 Error 사용
// → React Query가 AbortError를 '취소'로 처리해 isLoading이 유지되는 버그 방지
const fetchWithTimeout: typeof fetch = (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;

  if (url.includes("/auth/v1/")) return fetch(input, init);
  // Storage 업로드/다운로드는 용량에 따라 10초를 넘길 수 있음 (타임아웃으로 업로드 실패 방지)
  if (url.includes("/storage/v1/")) return fetch(input, init);
  // Edge Functions는 콜드 스타트·메일 Worker 호출 등으로 10초를 넘길 수 있음 (문의 submit → invoke)
  if (url.includes("/functions/v1/")) return fetch(input, init);

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Supabase 요청 시간 초과 (10s)")), 10_000)
  );
  return Promise.race([fetch(input, init), timeout]) as Promise<Response>;
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: { fetch: fetchWithTimeout },
});
