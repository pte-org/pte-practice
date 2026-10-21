"use client";

import { createContext, useContext, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { DEFAULT_THEME, THEME_ATTRIBUTE, THEME_PROVIDER_REQUIRED, THEME_STORAGE_KEY } from "./constants";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

const getServerTheme = (): Theme => DEFAULT_THEME;

const getBrowserTheme = (): Theme =>
  document.documentElement.getAttribute(THEME_ATTRIBUTE) === "light" ? "light" : "dark";

const subscribeTheme = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
  return () => observer.disconnect();
};

export const ThemeProvider = ({ children }: ThemeProviderProps): ReactElement => {
  const theme = useSyncExternalStore(subscribeTheme, getBrowserTheme, getServerTheme);

  const setTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(THEME_PROVIDER_REQUIRED);
  }
  return context;
}
