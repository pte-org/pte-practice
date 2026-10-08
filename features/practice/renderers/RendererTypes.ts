import type { PracticeTaskFixture } from "../fixtures";
import type { RecordedPracticeMedia } from "../media/contracts";

export interface TaskRendererProps {
  fixture: PracticeTaskFixture;
  rendererKey?: string | null;
  value: Record<string, unknown>;
  disabled?: boolean;
  onChange: (value: Record<string, unknown>) => void;
  onUploadRecording?: (blob: Blob, durationSeconds: number) => Promise<RecordedPracticeMedia>;
  sessionPublicId?: string;
  itemPublicId?: string;
}
