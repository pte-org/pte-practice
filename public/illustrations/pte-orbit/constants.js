// Saturated to sit next to the sign-in form: blue ≈ --action (#0d6fbe), navy ≈ the hero navy,
// ice/mint deepened so the props no longer read as washed-out pastels.
export const COLORS = Object.freeze({
  blue: 0x0d6fbe,
  navy: 0x0f2a5c,
  ice: 0x6fb2ec,
  porcelain: 0xf7f8fb,
  mint: 0x1fa88c,
  gold: 0xe2a447,
  silver: 0xb7c6d6,
  paper: 0xffffff,
});

export const THEMES = Object.freeze({
  light: { background: 0xedf2f8, orbit: 0x4a78b8, intensity: 0.55 },
  dark: { background: 0x0e192b, orbit: 0x6f9be0, intensity: 0.75 },
});

export const SETTINGS = Object.freeze({
  maxPixelRatio: 1.5,
  shadowMapSize: 1024,
  camera: [5.4, 3.1, 8.8],
  target: [0, 0.15, 0],
  minimumDistance: 6,
  maximumDistance: 16,
  maxDelta: 0.05,
});

export const TEXT = Object.freeze({
  pause: "Tạm dừng",
  resume: "Tiếp tục",
  lightTheme: "Nền sáng",
  darkTheme: "Nền tối",
  live: "LIVE 3D",
  paused: "PAUSED",
  loadError: "Không tải được 3D. Thử lại.",
});
