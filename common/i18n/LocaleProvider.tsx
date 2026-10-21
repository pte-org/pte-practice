"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import type { Locale, LocaleDict } from "./types";
import { en } from "./en";
import { vi } from "./vi";
import { DEFAULT_LOCALE, LOCALE_CHANGE_EVENT, LOCALE_PROVIDER_REQUIRED, LOCALE_STORAGE_KEY } from "./constants";

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

interface LocaleProviderProps {
  children: ReactNode;
}

const getServerLocale = (): Locale => DEFAULT_LOCALE;

const getStoredLocale = (): Locale => {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    return saved === "vi" || saved === "en" ? saved : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

const subscribeLocale = (onChange: () => void): (() => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  };
};

const resolveTranslation = (dictionary: LocaleDict, keys: string[]): string | null => {
  let current: unknown = dictionary;
  for (const key of keys) {
    if (typeof current !== "object" || current === null || !(key in current)) return null;
    current = Reflect.get(current, key);
  }
  return typeof current === "string" ? current : null;
};

export const LocaleProvider = ({ children }: LocaleProviderProps): ReactElement => {
  const locale = useSyncExternalStore(subscribeLocale, getStoredLocale, getServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  };

  const t = (key: TranslationKey): string => {
    const keys = key.split(".");
    return resolveTranslation(dictionaries[locale], keys)
      ?? resolveTranslation(dictionaries.en, keys)
      ?? key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error(LOCALE_PROVIDER_REQUIRED);
  }
  return context;
}

export const useTranslation = useLocale;
