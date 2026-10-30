export const THEMES = {
  DARK: "dark",
  LIGHT: "light",
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];

export const THEME_ATTRIBUTE = "data-theme";
export const THEME_STORAGE_KEY = "pte-practice-theme";
export const DEFAULT_THEME: Theme = THEMES.DARK;
export const THEME_PROVIDER_REQUIRED = "useTheme must be used within a ThemeProvider";

export const THEME_TRANSITION_CONFIG = {
  durationMs: 450,
  easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
  switchDelayMs: 350,
  fadeDelayMs: 100,
  removeDelayMs: 300,
  rippleColors: {
    dark: "#1e1e1e",
    light: "#F7F7F7",
  },
} as const;
