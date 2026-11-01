"use client";

import { useEffect, useRef, useState } from "react";

const ORBIT_SRC = "/illustrations/pte-orbit/index.html?embed=1&v=motion-10";
/** Show the iframe anyway if it never reports in (slow CDN, blocked WebGL). */
const READY_FALLBACK_MS = 8000;

interface OrbitMessage {
  source?: unknown;
  type?: unknown;
}

/**
 * Sign-in artwork: the 3D orbit scene in an iframe. It stays behind a plain poster until it posts
 * `{ source: "pte-orbit", type: "ready" | "error" }`, then the two cross-fade. The scene follows the theme
 * through the shared `pte-practice-theme` storage key.
 */
export function OrbitPanel({ title }: { title: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent<OrbitMessage | null>) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const { source, type } = event.data ?? {};
      if (source === "pte-orbit" && (type === "ready" || type === "error")) setReady(true);
    }
    window.addEventListener("message", onMessage);
    const timer = window.setTimeout(() => setReady(true), READY_FALLBACK_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="orbit-panel">
      <div aria-hidden="true" className={`orbit-poster${ready ? " orbit-poster-hidden" : ""}`}>
        <span className="orbit-poster-ring" />
      </div>
      <iframe ref={frameRef} title={title} src={ORBIT_SRC} loading="eager" referrerPolicy="no-referrer"
        className={`orbit-frame${ready ? " orbit-frame-ready" : ""}`} />
    </div>
  );
}
