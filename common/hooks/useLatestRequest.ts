"use client";

import { useEffect, useState } from "react";
import { createLatestGate, type LatestGate } from "./latest-request";

/** A `LatestGate` that lives as long as the component and invalidates its loads when the component unmounts. */
export function useLatestRequest(): LatestGate {
  const [gate] = useState(createLatestGate);
  useEffect(() => () => gate.cancel(), [gate]);
  return gate;
}
