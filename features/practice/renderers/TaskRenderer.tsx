"use client";

import { UnsupportedRenderer } from "./UnsupportedRenderer";
import type { TaskRendererProps } from "./RendererTypes";
import { allowlistedRendererKey, isClientRuntimeSupported } from "../renderer-allowlist";
import { renderTask } from "./renderer-registry";

export function TaskRenderer({ fixture, ...props }: TaskRendererProps) {
  const rendererKey = allowlistedRendererKey(props.rendererKey);
  if (!isClientRuntimeSupported(rendererKey)) {
    return <UnsupportedRenderer {...props} fixture={fixture} rendererKey={rendererKey} />;
  }
  const rendered = renderTask(rendererKey, { ...props, fixture, rendererKey });
  if (rendered) return rendered;
  return <UnsupportedRenderer {...props} fixture={fixture} rendererKey={rendererKey} />;
}
