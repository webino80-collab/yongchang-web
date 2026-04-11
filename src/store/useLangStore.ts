import { create } from "zustand";

type Lang = "ko" | "en";

interface LangStore {
  lang: Lang;
  imgBase: string;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangStore>((set) => ({
  lang: "ko",
  imgBase: "/images/ko",
  setLang: (lang) => set({ lang, imgBase: `/images/${lang}` }),
}));
