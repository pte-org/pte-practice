import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "practice"
  | "studyPack"
  | "progress"
  | "search"
  | "chevronDown"
  | "chevronRight"
  | "arrowRight"
  | "lock"
  | "play"
  | "mic"
  | "writing"
  | "reading"
  | "listening"
  | "bookOpen"
  | "sparkle"
  | "calendar"
  | "responses"
  | "check"
  | "signOut"
  | "info"
  | "personalIntroduction"
  | "readAloud"
  | "repeatSentence"
  | "describeImage"
  | "reTellLecture"
  | "shortQuestion"
  | "respondSituation"
  | "groupDiscussion"
  | "summarizeWritten"
  | "writeEmail"
  | "writeEssay"
  | "multipleChoiceSingle"
  | "multipleChoiceMultiple"
  | "reorderParagraphs"
  | "dragDrop"
  | "dropdown"
  | "summarizeSpoken"
  | "fillTypeIn"
  | "highlightSummary"
  | "missingWord"
  | "highlightIncorrect"
  | "dictation";

interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

const iconDefaults = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AppIcon({ name, size = 20, ...props }: AppIconProps) {
  const svgProps = {
    ...iconDefaults,
    ...props,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": props["aria-label"] ? undefined : true,
  };

  switch (name) {
    case "home":
      return <svg {...svgProps}><path d="m3.5 10.7 8.5-7 8.5 7" /><path d="M5.8 9.2v10.5h12.4V9.2M9.2 19.7v-5.5h5.6v5.5" /></svg>;
    case "practice":
      return <svg {...svgProps}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8.5 7h7M8.5 11h7M8.5 15h4.5" /><path d="M8.5 18h2" /></svg>;
    case "studyPack":
      return <svg {...svgProps}><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" /><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" /></svg>;
    case "progress":
      return <svg {...svgProps}><path d="M4 19V5M4 19h16" /><path d="m7 15 3.3-3.7 2.7 2.2 4.5-6" /><path d="M15.5 7.5h2v2" /></svg>;
    case "search":
      return <svg {...svgProps}><circle cx="10.8" cy="10.8" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>;
    case "chevronDown":
      return <svg {...svgProps}><path d="m6.5 9 5.5 5.5L17.5 9" /></svg>;
    case "chevronRight":
      return <svg {...svgProps}><path d="m9 5.5 6.5 6.5L9 18.5" /></svg>;
    case "arrowRight":
      return <svg {...svgProps}><path d="M4 12h15M13 6l6 6-6 6" /></svg>;
    case "lock":
      return <svg {...svgProps}><rect x="5.5" y="10" width="13" height="10" rx="2" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10M12 14v2" /></svg>;
    case "play":
      return <svg {...svgProps}><circle cx="12" cy="12" r="8.5" /><path d="m10.5 8.7 5 3.3-5 3.3V8.7Z" fill="currentColor" stroke="none" /></svg>;
    case "mic":
      return <svg {...svgProps}><rect x="8.5" y="3.5" width="7" height="11" rx="3.5" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.5 21h7" /></svg>;
    case "writing":
      return <svg {...svgProps}><path d="M6 3.5h8l4 4v13H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 3.5v4h4M8 15.5l5.7-5.7 1.8 1.8-5.7 5.7-2.4.6.6-2.4Z" /></svg>;
    case "reading":
      return <svg {...svgProps}><path d="M4 5.5c2.7-.9 5.3-.5 8 1.2v12.8c-2.7-1.7-5.3-2.1-8-1.2V5.5Z" /><path d="M20 5.5c-2.7-.9-5.3-.5-8 1.2v12.8c2.7-1.7 5.3-2.1 8-1.2V5.5Z" /></svg>;
    case "listening":
      return <svg {...svgProps}><path d="M5.5 11.5a6.5 6.5 0 0 1 13 0c0 2.4-1 3.7-2.2 4.7-.9.8-1.3 1.4-1.3 2.8" /><path d="M8.3 11.7a3.7 3.7 0 0 1 7.4 0c0 1.3-.4 2-1.2 2.7" /><path d="M12 20.5h.1" /></svg>;
    case "bookOpen":
      return <svg {...svgProps}><path d="M4 5.5c2.7-.9 5.3-.5 8 1.2v12.8c-2.7-1.7-5.3-2.1-8-1.2V5.5Z" /><path d="M20 5.5c-2.7-.9-5.3-.5-8 1.2v12.8c2.7-1.7 5.3-2.1 8-1.2V5.5Z" /><path d="M12 7v12.5" /></svg>;
    case "sparkle":
      return <svg {...svgProps}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>;
    case "calendar":
      return <svg {...svgProps}><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 9.5h16M8 13h.1M12 13h.1M16 13h.1M8 17h.1M12 17h.1" /></svg>;
    case "responses":
      return <svg {...svgProps}><rect x="5" y="4" width="11" height="13" rx="1.5" /><path d="M8 7h5M8 10h5M8 13h3" /><path d="M8 20h9a2 2 0 0 0 2-2V8" /></svg>;
    case "check":
      return <svg {...svgProps}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.3 2.3 4.8-5" /></svg>;
    case "signOut":
      return <svg {...svgProps}><path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" /></svg>;
    case "info":
      return <svg {...svgProps}><circle cx="12" cy="12" r="8.5" /><path d="M12 10.5v5M12 7.5h.1" /></svg>;
    case "personalIntroduction":
      return <svg {...svgProps}><circle cx="12" cy="8" r="3" /><path d="M6.5 20a5.5 5.5 0 0 1 11 0M4.5 5.5h2M17.5 5.5h2M5.5 9.5h1.5M17 9.5h1.5" /></svg>;
    case "readAloud":
      return <svg {...svgProps}><circle cx="8.2" cy="8.4" r="2.5" /><path d="M3.8 17a4.4 4.4 0 0 1 8.8 0M16 9.5a3 3 0 0 1 0 5M18.5 7a6.5 6.5 0 0 1 0 10" /></svg>;
    case "repeatSentence":
      return <svg {...svgProps}><path d="M3.5 12h2l1.5-4 2.2 8 2.2-11 2.2 14 2.2-8 1.7 3h2.5" /></svg>;
    case "describeImage":
      return <svg {...svgProps}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="8.5" cy="9" r="1.4" /><path d="m5.5 17 4.2-4.2 3.1 2.8 2-2 3.7 3.4" /></svg>;
    case "reTellLecture":
      return <svg {...svgProps}><rect x="3.5" y="4" width="12" height="10" rx="1.5" /><path d="M6.5 8h6M6.5 11h3M9.5 14v3M6.5 20h6" /><path d="M18 9.5v5M16.5 11a2.2 2.2 0 0 0 0 2M19.5 9a4 4 0 0 1 0 6" /></svg>;
    case "shortQuestion":
      return <svg {...svgProps}><path d="M5 5.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" /><path d="M9.5 9.5a2.5 2.5 0 1 1 4.1 1.9c-.9.7-1.6 1-1.6 2M12 16h.1" /></svg>;
    case "respondSituation":
      return <svg {...svgProps}><path d="M4 5.5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 3v-3H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" /><path d="M7 10h10M7 13h6" /></svg>;
    case "groupDiscussion":
      return <svg {...svgProps}><circle cx="8" cy="8" r="2.5" /><circle cx="16" cy="8" r="2.5" /><path d="M3.5 18a4.5 4.5 0 0 1 9 0M11.5 18a4.5 4.5 0 0 1 9 0M12 5.5v5M9.5 8h5" /></svg>;
    case "summarizeWritten":
      return <svg {...svgProps}><path d="M6 3.5h8l4 4v13H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M14 3.5v4h4M8 11h8M8 14h8M8 17h5" /></svg>;
    case "writeEmail":
      return <svg {...svgProps}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="m4.5 7 7.5 6 7.5-6M4 18l5.5-5M20 18l-5.5-5" /></svg>;
    case "writeEssay":
      return <svg {...svgProps}><path d="M5.5 3.5h8l4 4v13h-12a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M13.5 3.5v4h4M8 12h6M8 15h4" /><path d="m14 18.5 4.6-4.6 1.7 1.7-4.6 4.6-2.5.8.8-2.5Z" /></svg>;
    case "multipleChoiceSingle":
      return <svg {...svgProps}><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.3 2.3 4.8-5" /></svg>;
    case "multipleChoiceMultiple":
      return <svg {...svgProps}><rect x="4" y="4" width="6" height="6" rx="1" /><path d="m5.5 7 1.2 1.2L9 5.8M14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>;
    case "reorderParagraphs":
      return <svg {...svgProps}><path d="M4 6h11M4 12h11M4 18h11M18 8V4l2.5 2.5M18 16v4l-2.5-2.5" /></svg>;
    case "dragDrop":
      return <svg {...svgProps}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /><path d="M13.5 6.5h6M16.5 3.5v6M10.5 17.5h-6M7.5 14.5v6" /></svg>;
    case "dropdown":
      return <svg {...svgProps}><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m8 10 4 4 4-4" /></svg>;
    case "summarizeSpoken":
      return <svg {...svgProps}><rect x="4" y="4" width="10" height="16" rx="1.5" /><path d="M7 8h4M7 11h4M7 14h2" /><path d="M17 8.5v5M15.5 10a2.2 2.2 0 0 0 0 2M18.5 8a4 4 0 0 1 0 6" /></svg>;
    case "fillTypeIn":
      return <svg {...svgProps}><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="M7 12h6M15.5 9.5v5M14 12h3" /></svg>;
    case "highlightSummary":
      return <svg {...svgProps}><path d="M5.5 3.5h8l4 4v13h-12a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M13.5 3.5v4h4M7 11h8M7 15h8" /><path d="M6.5 17.5h7" strokeWidth="3" /></svg>;
    case "missingWord":
      return <svg {...svgProps}><path d="M4.5 5.5h15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7l-4.5 3v-3h-3.5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" /><path d="M8 11.5h.1M12 11.5h.1M16 11.5h.1" /></svg>;
    case "highlightIncorrect":
      return <svg {...svgProps}><path d="M5.5 3.5h8l4 4v13h-12a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" /><path d="M13.5 3.5v4h4M7 11h8M7 15h5" /><path d="m15 15 4 4M19 15l-4 4" /></svg>;
    case "dictation":
      return <svg {...svgProps}><path d="M4 9v6M7 6v12M10 3v18M14 6v12M17 9v6M20 11v2" /><path d="M5 20h14" /></svg>;
  }
}

export function ProductMark({ className, ...props }: Omit<SVGProps<SVGSVGElement>, "children">) {
  return (
    <svg
      {...props}
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden={props["aria-label"] ? undefined : true}
    >
      <path
        d="M11 8.5h12.3c7.7 0 12.7 3.9 12.7 10.1 0 6.3-5 10.2-12.7 10.2h-5.1v10.7H11V8.5Zm7.2 6v8.3h4.8c3.5 0 5.7-1.4 5.7-4.2 0-2.7-2.2-4.1-5.7-4.1h-4.8Z"
        fill="currentColor"
      />
      <path d="M31.6 30.9c3.8.4 6.1 2.1 7.6 4.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M34.4 27.7c4.9.5 8.1 2.8 10.1 6.4" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}
