import { TEXT } from "./constants.js";

const host = document.querySelector("#canvas-host");
const loading = document.querySelector("#loading");
const fallback = document.querySelector("#fallback");
const motionButton = document.querySelector("#motion-toggle");
const themeButton = document.querySelector("#theme-toggle");
const resetButton = document.querySelector("#reset-view");
const renderState = document.querySelector("#render-state");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const embedded = document.documentElement.dataset.mode === "embed";
const THEME_STORAGE_KEY = "pte-practice-theme";
let scene = null;
let playing = embedded || !motionPreference.matches;
let dark = readStoredTheme() === "dark";
let starting = false;

function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be disabled; fall back to the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

const setButton = (button, label, symbol) => {
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = symbol;
  button.replaceChildren(document.createTextNode(label + " "), icon);
};

const updateMotion = () => {
  scene?.setMotion(playing);
  motionButton.setAttribute("aria-pressed", String(!playing));
  setButton(motionButton, playing ? TEXT.pause : TEXT.resume, playing ? "Ⅱ" : "▷");
  renderState.textContent = playing ? TEXT.live : TEXT.paused;
};

const applyTheme = (theme) => {
  dark = theme === "dark";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  themeButton.setAttribute("aria-pressed", String(dark));
  setButton(themeButton, dark ? TEXT.lightTheme : TEXT.darkTheme, String.fromCodePoint(0x25d0));
  scene?.setTheme(theme);
};

const persistTheme = (theme) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be disabled in private or embedded browser contexts.
  }
};

/** Tells the embedding page (same origin) when the scene is visible or failed, so it can fade in. */
const notifyHost = (type) => {
  if (!embedded || window.parent === window) return;
  window.parent.postMessage({ source: "pte-orbit", type }, window.location.origin);
};

const showFailure = () => {
  notifyHost("error");
  loading.hidden = true;
  fallback.hidden = false;
  motionButton.disabled = true;
  resetButton.disabled = true;
  host.dataset.ready = "false";
  document.querySelector("#fallback-detail").textContent = TEXT.loadError;
};

const start = async () => {
  if (starting) return;
  starting = true;
  loading.hidden = false;
  fallback.hidden = true;
  try {
    scene?.dispose();
    scene = null;
    const { mountScene } = await import("./scene.js?v=motion-10");
    // Embedded on the sign-in page the scene always animates, whatever the OS motion setting.
    scene = mountScene(host, !embedded && motionPreference.matches, { intro: embedded });
    scene.setTheme(dark ? "dark" : "light");
    updateMotion();
    loading.hidden = true;
    motionButton.disabled = false;
    resetButton.disabled = false;
    // Wait for the first painted frame so the host never fades in an empty canvas.
    window.requestAnimationFrame(() => notifyHost("ready"));
  } catch (error) {
    console.error("PTE Orbit could not start:", error);
    showFailure();
  } finally {
    starting = false;
  }
};

motionButton.addEventListener("click", () => {
  playing = !playing;
  updateMotion();
});
resetButton.addEventListener("click", () => scene?.reset());
themeButton.addEventListener("click", () => {
  const nextTheme = dark ? "light" : "dark";
  persistTheme(nextTheme);
  applyTheme(nextTheme);
});
window.addEventListener("storage", (event) => {
  if (event.key === THEME_STORAGE_KEY) {
    applyTheme(event.newValue === "light" ? "light" : "dark");
  }
});
motionPreference.addEventListener("change", () => {
  playing = embedded || !motionPreference.matches;
  updateMotion();
});
host.addEventListener("scene-error", showFailure);
document.querySelector("#retry").addEventListener("click", () => window.location.reload());
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) scene?.dispose();
});
applyTheme(dark ? "dark" : "light");

// Let the login form paint first. The poster remains visible while Three.js
// downloads and the interactive scene initializes as an enhancement.
const scheduleStart = () => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void start(), { timeout: 800 });
    return;
  }
  window.setTimeout(() => void start(), 0);
};

scheduleStart();
