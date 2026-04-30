import { useEffect } from "react";
import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import { authService } from "@/lib/authService";
import type { Profile } from "@/types";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  /** profiles 조회 중 (app_metadata 관리자가 아닐 때만 true — 관리자 페이지 진입 전 오판 방지) */
  profileLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  profileLoading: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    // 60초 타임아웃 — Supabase cold start(첫 요청 지연) 대응
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("로그인 시간이 초과되었습니다. 네트워크를 확인해 주세요.")), 60000)
    );

    const doSignIn = async () => {
      const data = await authService.signIn(email, password);
      set({ user: data.user, session: data.session });
      if (data.user) {
        try {
          const profile = await authService.getProfile(data.user.id);
          set({ profile });
        } catch {
          set({ profile: null });
        }
      }
    };

    await Promise.race([doSignIn(), timeout]);
  },

  signUp: async (email, password, nickname) => {
    await authService.signUp(email, password, nickname);
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, profile: null, session: null, profileLoading: false });
  },
}));

let authListenerInitialized = false;

function initializeAuthListenerOnce() {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  // onAuthStateChange가 아예 안 오는 비정상 케이스만 대비 (INITIAL_SESSION은 보통 즉시 옴)
  const fallback = setTimeout(() => {
    if (useAuthStore.getState().loading) {
      console.warn("[useAuth] 세션 이벤트 지연 — 로딩 강제 종료");
      useAuthStore.getState().setLoading(false);
    }
  }, 20_000);

  supabase.auth.onAuthStateChange((event, session) => {
    console.log("[useAuth] auth event:", event, "user:", session?.user?.email ?? "없음");

    useAuthStore.getState().setSession(session);
    useAuthStore.getState().setUser(session?.user ?? null);

    if (!session?.user) {
      useAuthStore.getState().setProfile(null);
      useAuthStore.setState({ profileLoading: false });
      clearTimeout(fallback);
      useAuthStore.getState().setLoading(false);
      return;
    }

    clearTimeout(fallback);
    useAuthStore.getState().setLoading(false);

    // 관리자 페이지의 레벨 분기(예: level 5)는 profile.level을 사용하므로
    // JWT 관리자 여부와 관계없이 profile 조회가 끝날 때까지 대기한다.
    useAuthStore.setState({ profileLoading: true });

    void (async () => {
      try {
        const profile = await authService.getProfile(session.user.id);
        console.log("[useAuth] profile:", profile);
        useAuthStore.getState().setProfile(profile);
      } catch (err) {
        console.error("[useAuth] getProfile 실패:", err);
        useAuthStore.getState().setProfile(null);
      } finally {
        useAuthStore.setState({ profileLoading: false });
      }
    })();
  });
}

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    initializeAuthListenerOnce();
  }, []);

  return store;
}
