"use client";

import { UnsupportedRenderer } from "./UnsupportedRenderer";
import type { TaskRendererProps } from "./RendererTypes";
import { allowlistedRendererKey, isClientRuntimeSupported } from "../renderer-allowlist";
import { PromptMedia } from "./PromptMedia";
import { renderTask } from "./renderer-registry";

export function TaskRenderer({ fixture, ...props }: TaskRendererProps) {
  const rendererKey = allowlistedRendererKey(props.rendererKey);
  const rendered = isClientRuntimeSupported(rendererKey)
    ? renderTask(rendererKey, { ...props, fixture, rendererKey })
    : null;
  if (!rendered) return <UnsupportedRenderer {...props} fixture={fixture} rendererKey={rendererKey} />;
  return (
    <>
      <PromptMedia fixture={fixture} />
      {rendered}
    </>
  );
}
