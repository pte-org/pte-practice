import Image from "next/image";
import type { ReactElement } from "react";
import type { PracticeAppearance } from "./types";

interface PracticeBackgroundProps { value: PracticeAppearance }

/** The home workspace and exercise delivery use the same local scene and focus-mode behavior. */
export const PracticeBackground = ({ value }: PracticeBackgroundProps): ReactElement | null => {
  if (value.focus || value.background === "default") return null;
  return (
    <div className={`practice-scene practice-background-${value.background}`} aria-hidden="true">
      {value.background === "custom" && value.image
        ? <Image src={value.image} alt="" fill unoptimized sizes="100vw" className="practice-scene-image" /> : null}
    </div>
  );
};
