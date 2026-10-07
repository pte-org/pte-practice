import type { PracticeTaskFixture } from "../fixtures";

export interface TaskRendererProps {
  fixture: PracticeTaskFixture;
  rendererKey?: string | null;
  value: Record<string, unknown>;
  disabled?: boolean;
  onChange: (value: Record<string, unknown>) => void;
}
