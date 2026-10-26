"use client";

import { createContext, useContext, useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { DEFAULT_THEME, THEME_ATTRIBUTE, THEME_PROVIDER_REQUIRED, THEME_STORAGE_KEY } from "./constants";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }) => void;
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

  const toggleTheme = (event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }) => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    if (typeof document === "undefined" || typeof window === "undefined") {
      setTheme(nextTheme);
      return;
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      setTheme(nextTheme);
      return;
    }

    let x = event && "clientX" in event && typeof event.clientX === "number" ? event.clientX : null;
    let y = event && "clientY" in event && typeof event.clientY === "number" ? event.clientY : null;

    if (x === null || y === null) {
      const btn = document.querySelector('button[aria-label*="theme" i]') as HTMLElement | null;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else {
        x = 40;
        y = window.innerHeight - 60;
      }
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Modern View Transitions API for hardware-accelerated circular expanding transition
    const docWithTransition = document as unknown as {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (typeof docWithTransition.startViewTransition === "function") {
      const transition = docWithTransition.startViewTransition(() => {
        setTheme(nextTheme);
      });

      transition.ready
        .then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

          (document.documentElement as unknown as {
            animate: (keyframes: unknown[], options: unknown) => Animation;
          }).animate(
            [
              { clipPath: clipPath[0] },
              { clipPath: clipPath[1] },
            ],
            {
              duration: 500,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {
          // If view transition fails, theme is already set
        });
      return;
    }

    // Fallback circular expanding ripple if View Transitions is unsupported
    const ripple = document.createElement("div");
    ripple.className = "theme-ripple-overlay";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${endRadius * 2}px`;
    ripple.style.height = `${endRadius * 2}px`;
    ripple.style.backgroundColor = nextTheme === "dark" ? "#1e1e1e" : "#f2f6fa";
    document.body.appendChild(ripple);

    requestAnimationFrame(() => {
      ripple.classList.add("is-active");
    });

    setTimeout(() => {
      setTheme(nextTheme);
      setTimeout(() => {
        ripple.style.opacity = "0";
        setTimeout(() => {
          ripple.remove();
        }, 300);
      }, 100);
    }, 350);
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
