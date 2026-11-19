import React, { createContext, useContext, useEffect, useState } from 'react';
import { LangMode, SUPPORTED_LANGS, UI_TRANSLATIONS } from '../lib/translations';

export type { LangMode };
export { SUPPORTED_LANGS };

interface I18nContextValue {
  lang: LangMode;
  setLang: (next: LangMode) => void;
  toggleLang: () => void;
  t: (es: string, en?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const VALID_LANG_SET = new Set<LangMode>(['es', 'en', 'pt', 'de', 'ru', 'zh']);

function readLangCookie(): LangMode {
  if (typeof document === 'undefined') return 'es';
  const match = document.cookie.match(/(?:^|;\s*)joyride_lang=([a-z]{2})/);
  const val = match?.[1] as LangMode | undefined;
  return val && VALID_LANG_SET.has(val) ? val : 'es';
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

  const toggleLang = () =>
    setLangState((current) => {
      const idx = SUPPORTED_LANGS.findIndex((item) => item.id === current);
      const nextIdx = (idx + 1) % SUPPORTED_LANGS.length;
      return SUPPORTED_LANGS[nextIdx].id;
    });

  const t = (es: string, en?: string): string => {
    if (lang === 'es') return es;
    const entry = UI_TRANSLATIONS[es];
    if (lang === 'en') return entry?.en || en || es;
    return entry?.[lang] || en || entry?.en || es;
  };

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
