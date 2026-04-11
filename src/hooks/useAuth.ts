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

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    // onAuthStateChange가 아예 안 오는 비정상 케이스만 대비 (INITIAL_SESSION은 보통 즉시 옴)
    const fallback = setTimeout(() => {
      if (useAuthStore.getState().loading) {
        console.warn("[useAuth] 세션 이벤트 지연 — 로딩 강제 종료");
        useAuthStore.getState().setLoading(false);
      }
    }, 20_000);

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

        const metaAdmin = session.user.app_metadata?.is_admin === true;
        clearTimeout(fallback);
        useAuthStore.getState().setLoading(false);

        // JWT에 관리자 플래그가 있으면 프로필 대기 없이 진입 (닉네임 등은 백그라운드 로드)
        if (!metaAdmin) {
          useAuthStore.setState({ profileLoading: true });
        }

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
      }
    );

    return () => {
      clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, []);

  return store;
}
