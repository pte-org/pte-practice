"use client";

import { useId, type ReactElement } from "react";
import { PIP_JAW_PATH, PIP_LAYERS } from "./constants";
import { usePipLayersReady } from "./usePipLayersReady";

interface PipArtworkProps { greeting?: boolean; animate?: boolean; className?: string }

/** A cutout puppet: the body image never changes; only independent joints and lids move. */
export const PipArtwork = ({ greeting = false, animate = false, className = "" }: PipArtworkProps): ReactElement => {
  const clipId = useId();
  const ready = usePipLayersReady(animate);
  return (
    <svg viewBox="0 0 640 768" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
      className={`pip-artwork${ready ? " pip-artwork-ready" : ""}${greeting ? " pip-artwork-greeting" : ""} ${className}`.trim()}>
      <defs>
        <clipPath id={`${clipId}-left`}><ellipse cx="172" cy="261" rx="27" ry="39" /></clipPath>
        <clipPath id={`${clipId}-right`}><ellipse cx="305" cy="280" rx="43" ry="43" /></clipPath>
        <clipPath id={`${clipId}-jaw`}><path d={PIP_JAW_PATH} /></clipPath>
        <mask id={`${clipId}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="768">
          <rect width="640" height="768" fill="white" />
          <path d={PIP_JAW_PATH} fill="black" />
        </mask>
      </defs>
      <g className="pip-facing-right" transform="translate(640 0) scale(-1 1)">
      <g className="pip-wing-joint">
        <image href={PIP_LAYERS.wing} x="340" y="270" width="200" height="188" />
      </g>
      <path d={PIP_JAW_PATH} fill="#76301e" />
      <image className="pip-body-fixed" href={PIP_LAYERS.body} x="90" y="60" width="402" height="630"
        mask={`url(#${clipId}-body)`} />
      <g className="pip-mouth-joint">
        <g clipPath={`url(#${clipId}-jaw)`}>
          <image href={PIP_LAYERS.body} x="90" y="60" width="402" height="630" />
        </g>
      </g>
      <g clipPath={`url(#${clipId}-left)`}>
        <g className="pip-eyelid pip-eyelid-left">
          <ellipse cx="172" cy="261" rx="29" ry="41" fill="#0864e9" />
          <image href={PIP_LAYERS.lidLeft} x="145" y="222" width="54" height="78" preserveAspectRatio="none" />
        </g>
      </g>
      <g clipPath={`url(#${clipId}-right)`}>
        <g className="pip-eyelid pip-eyelid-right">
          <ellipse cx="305" cy="280" rx="45" ry="45" fill="#0864e9" />
          <image href={PIP_LAYERS.lidRight} x="262" y="237" width="86" height="86" preserveAspectRatio="none" />
        </g>
      </g>
      </g>
    </svg>
  );
};
