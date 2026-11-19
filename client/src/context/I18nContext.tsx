import React, { createContext, useContext, useEffect, useState } from 'react';

export type LangMode = 'es' | 'en';

interface I18nContextValue {
  lang: LangMode;
  setLang: (next: LangMode) => void;
  toggleLang: () => void;
  t: (es: string, en: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readLangCookie(): LangMode {
  if (typeof document === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|;\s*)joyride_lang=(es|en)/);
  return match?.[1] === 'en' ? 'en' : 'es';
}

function writeLangCookie(lang: LangMode) {
  if (typeof document === 'undefined') return;
  document.cookie = `joyride_lang=${lang}; max-age=31536000; path=/; SameSite=Lax`;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangMode>(() => readLangCookie());

  useEffect(() => {
    document.documentElement.lang = lang;
    writeLangCookie(lang);
  }, [lang]);

  const setLang = (next: LangMode) => setLangState(next);
  const toggleLang = () => setLangState((l) => (l === 'es' ? 'en' : 'es'));
  const t = (es: string, en: string) => (lang === 'en' ? en : es);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
