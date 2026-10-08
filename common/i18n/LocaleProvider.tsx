"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale, LocaleDict } from "./types";
import { en } from "./en";
import { vi } from "./vi";

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

type DotNestedKeys<T> = (T extends object ?
    { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<keyof T, symbol>]
    : "") extends infer D ? Extract<D, string> : never;

export type TranslationKey = DotNestedKeys<LocaleDict>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const dictionaries: Record<Locale, LocaleDict> = { en, vi };

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("pte-practice-locale") as Locale;
    if (saved === "vi" || saved === "en") {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
    localStorage.setItem("pte-practice-locale", newLocale);
  };

  const t = (key: TranslationKey): string => {
    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = dictionaries[locale];
    
    for (const k of keys) {
      if (current === undefined || current === null) break;
      current = current[k];
    }
    
    if (typeof current === "string") return current;
    
    // Fallback to English
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fallbackCurrent: any = dictionaries.en;
    for (const k of keys) {
      if (fallbackCurrent === undefined || fallbackCurrent === null) break;
      fallbackCurrent = fallbackCurrent[k];
    }
    
    return typeof fallbackCurrent === "string" ? fallbackCurrent : key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export const useTranslation = useLocale;
