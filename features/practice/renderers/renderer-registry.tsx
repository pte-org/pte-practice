import type { ReactNode } from "react";
import { isClientRuntimeSupported, type AllowlistedRendererKey } from "../renderer-allowlist";
import { BlankRenderer } from "./BlankRenderer";
import { ChoiceRenderer } from "./ChoiceRenderer";
import { HighlightRenderer } from "./HighlightRenderer";
import { OrderRenderer } from "./OrderRenderer";
import { RecordingRenderer } from "./RecordingRenderer";
import type { TaskRendererProps } from "./RendererTypes";
import { TextRenderer } from "./TextRenderer";

type RegisteredRenderer = (props: TaskRendererProps) => ReactNode;

const RENDERER_REGISTRY: Partial<Record<AllowlistedRendererKey, RegisteredRenderer>> = {
  PERSONAL_INTRODUCTION_V1: (props) => <RecordingRenderer {...props} />,
  READ_ALOUD_V1: (props) => <RecordingRenderer {...props} />,
  MC_READING_SINGLE_V1: (props) => <ChoiceRenderer {...props} />,
  MC_READING_MULTIPLE_V1: (props) => <ChoiceRenderer {...props} />,
  MC_LISTENING_SINGLE_V1: (props) => <ChoiceRenderer {...props} />,
  MC_LISTENING_MULTIPLE_V1: (props) => <ChoiceRenderer {...props} />,
  SELECT_MISSING_WORD_V1: (props) => <ChoiceRenderer {...props} />,
  RE_ORDER_PARAGRAPHS_V1: (props) => <OrderRenderer {...props} />,
  FILL_IN_THE_BLANKS_DRAG_AND_DROP_V1: (props) => <BlankRenderer {...props} />,
  FILL_IN_THE_BLANKS_DROPDOWN_V1: (props) => <BlankRenderer {...props} />,
  HIGHLIGHT_CORRECT_SUMMARY_V1: (props) => <HighlightRenderer {...props} />,
  HIGHLIGHT_INCORRECT_WORDS_V1: (props) => <HighlightRenderer {...props} />,
  SUMMARIZE_WRITTEN_TEXT_V1: (props) => <TextRenderer {...props} />,
  WRITE_ESSAY_V1: (props) => <TextRenderer {...props} />,
};

export function renderTask(key: AllowlistedRendererKey | null, props: TaskRendererProps): ReactNode | null {
  return key && isClientRuntimeSupported(key) ? RENDERER_REGISTRY[key]?.(props) ?? null : null;
}
