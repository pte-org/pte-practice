"use client";

import { useEffect, useState } from "react";
import { CHAT_NARROW_QUERY } from "./constants";

/** True while the viewport matches the narrow-screen query; false on the server and before the first check. */
export function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(CHAT_NARROW_QUERY);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}
