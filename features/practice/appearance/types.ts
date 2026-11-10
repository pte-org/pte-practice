import type { BACKGROUND_OPTIONS, BACKGROUND_BLUR_OPTIONS, GLASS_OPACITY_OPTIONS } from "./constants";

export interface PracticeAppearance {
  background: typeof BACKGROUND_OPTIONS[number];
  image: string | null;
  blur: typeof BACKGROUND_BLUR_OPTIONS[number];
  opacity: typeof GLASS_OPACITY_OPTIONS[number];
  focus: boolean;
}
