"use client";

import { useEffect, useState } from "react";
import { PIP_LAYERS } from "./constants";

/** Start the finite greeting only after all cutout layers can be drawn. */
export const usePipLayersReady = (animate: boolean): boolean => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!animate) return;
    let active = true;
    void Promise.all(Object.values(PIP_LAYERS).map((src) => {
      const image = new window.Image();
      image.src = src;
      return image.decode();
    })).then(() => {
      if (active) setReady(true);
    }).catch(() => { /* Keep the resting pose if a layer cannot be decoded. */ });
    return () => { active = false; };
  }, [animate]);
  return ready;
};
