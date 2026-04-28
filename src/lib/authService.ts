import { supabase } from "./supabaseClient";
import type { Profile } from "@/types";

export const authService = {
  async signUp(email: string, password: string, nickname: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname },
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * 관리자 패널에서 `auth.signUp`으로 신규 계정을 만듭니다.
   * 이메일 자동 확인이 켜져 있으면 가입 직후 클라이언트 세션이 신규 사용자로 바뀌므로,
   * 관리자 액세스·리프레시 토큰으로 세션을 복원합니다.
   *
   * 즉시 로그인 가능하게 하려면 Supabase Dashboard → Authentication → Providers → Email
   * 에서 "Confirm email" 을 끄세요.
   */
  async adminSignUpOperator(params: {
    email: string;
    password: string;
    nickname?: string;
    grantAdmin?: boolean;
  }) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;
    const adminSession = sessionData.session;
    if (!adminSession?.user) {
      throw new Error("관리자 세션이 없습니다. 다시 로그인해 주세요.");
    }

    const email = params.email.trim();
    const nickname = params.nickname?.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: params.password,
      options: {
        data: nickname ? { nickname } : undefined,
      },
    });
    if (error) throw error;

    const newUserId = data.user?.id;
    if (!newUserId) {
      throw new Error("계정 생성에 실패했습니다.");
    }

    try {
      if (data.session && adminSession) {
        const { error: restoreErr } = await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
        if (restoreErr) throw restoreErr;
      }

      if (params.grantAdmin !== false) {
        const { error: profileErr } = await supabase
          .from("profiles")
          .update({ is_admin: true })
          .eq("id", newUserId);
        if (profileErr) throw profileErr;
      }
    } catch (e) {
      if (data.session && adminSession) {
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }
      throw e;
    }

    return { userId: newUserId, email };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data as Profile;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Pick<Profile, "nickname" | "phone" | "homepage" | "memo" | "avatar_url">>
  ) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;
    const { error } = await supabase.storage
      .from("public")
      .upload(path, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage.from("public").getPublicUrl(path);
    return data.publicUrl;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
};
