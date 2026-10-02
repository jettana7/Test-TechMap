import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { HTML_LANG, detectLang, translate, type Lang, type MessageKey, type Vars } from '../domain/i18n';
import { provinceLabel } from '../domain/provinceNames';

const STORAGE_KEY = 'technician-map-lang';

interface I18n {
  readonly lang: Lang;
  readonly setLang: (lang: Lang) => void;
  readonly t: (key: MessageKey, vars?: Vars) => string;
  /** ชื่อจังหวัดตามภาษาที่เลือก */
  readonly label: (code: string) => string;
}

const Context = createContext<I18n | undefined>(undefined);

function initialLang(): Lang {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* โหมดส่วนตัวอาจอ่านไม่ได้ ใช้ค่าจากเบราว์เซอร์แทน */
  }
  return detectLang(saved, navigator.languages ?? [navigator.language]);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ไม่ต้องทำอะไร ครั้งหน้าเลือกใหม่ */
    }
  }, []);

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      label: (code) => provinceLabel(code, lang),
    }),
    [lang, setLang],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(Context);
  if (!value) throw new Error('useI18n ต้องใช้ภายใน I18nProvider');
  return value;
}
