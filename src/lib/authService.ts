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
