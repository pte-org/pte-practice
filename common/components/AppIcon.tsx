import type { ReactElement, SVGProps } from "react";
import Image from "next/image";
import { ICON_PATHS, type IconName } from "./icon-paths";

export type { IconName } from "./icon-paths";

interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

/** Draws a Material Design Icons glyph in the current text colour; decorative unless an aria-label is given. */
export function AppIcon({ name, size = 20, ...props }: AppIconProps): ReactElement {
  return (
    <svg
      fill="currentColor"
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden={props["aria-label"] ? undefined : true}
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

interface ProductMarkProps {
  className?: string;
}

export const ProductMark = ({ className }: ProductMarkProps): ReactElement => {
  return (
    <Image
      src="/logo-ppte.png"
      alt="PPTE Logo"
      width={120}
      height={40}
      className={className}
    />
  );
};
