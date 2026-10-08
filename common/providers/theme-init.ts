export const THEME_INIT_SCRIPT = `
  (function() {
    try {
      var saved = localStorage.getItem("pte-practice-theme");
      var theme = "dark";
      if (saved === "light" || saved === "dark") {
        theme = saved;
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        theme = "light";
      }
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {}
  })();
`;
