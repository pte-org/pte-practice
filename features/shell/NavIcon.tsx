import type { ReactElement } from "react";

/**
 * New (neither practice nor @pte/ui has these): the sidebar's thin outline icons, drawn after the Pearson PTE
 * practice app — house with an arched door, clipboard, cube with a sparkle, and a progress trail ending in a dot.
 */
export type NavIconName = "home" | "practice" | "studyPack" | "progress";

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Glyph({ name }: { name: NavIconName }): ReactElement {
  switch (name) {
    case "home":
      return <path {...STROKE} d="M4 10.4 12 4l8 6.4V19.5a1 1 0 0 1-1 1h-4.25v-5a2.75 2.75 0 0 0-5.5 0v5H5a1 1 0 0 1-1-1z" />;
    case "practice":
      return (
        <>
          <path {...STROKE} d="M8.5 4.5H6.5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-14a1 1 0 0 0-1-1h-2" />
          <rect x="8.5" y="3" width="7" height="3.2" rx="0.8" fill="currentColor" />
        </>
      );
    case "studyPack":
      return (
        <>
          <path {...STROKE} d="M12 4.5 4.5 8.4v7.2L12 19.5l7.5-3.9V8.4z M4.5 8.4 12 12.3l7.5-3.9 M12 12.3v7.2" />
          <path fill="currentColor" d="m12 6.1.55 1.15 1.2.2-.88.82.2 1.2L12 8.9l-1.07.57.2-1.2-.88-.82 1.2-.2z" />
        </>
      );
    case "progress":
      return (
        <>
          <path {...STROKE} d="M3.5 16.5c1.2 0 1.6-2.5 3-2.5s1.7 2.5 3.2 2.5 2-4 3.5-4 1.6 1.6 2.8 1.6c1 0 1.6-1.8 2.3-3.1" />
          <circle cx="19.2" cy="8.6" r="1.7" fill="currentColor" />
        </>
      );
    default:
      return <></>;
  }
}

export function NavIcon({ name, size = 24 }: { name: NavIconName; size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <Glyph name={name} />
    </svg>
  );
}
