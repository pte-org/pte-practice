import { DEFAULT_THEME, THEME_ATTRIBUTE, THEME_STORAGE_KEY, THEMES } from "./constants";

export const THEME_INIT_SCRIPT = `
  (function() {
    try {
      var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
      var theme = "${DEFAULT_THEME}";
      if (saved === "${THEMES.LIGHT}" || saved === "${THEMES.DARK}") {
        theme = saved;
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        theme = "${THEMES.LIGHT}";
      }
      document.documentElement.setAttribute("${THEME_ATTRIBUTE}", theme);
    } catch (e) {}
  })();
`;
