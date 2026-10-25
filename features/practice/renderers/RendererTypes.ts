import type { PracticeTaskFixture } from "../fixtures";
import type { RecordedPracticeMedia } from "../media/contracts";

/** What a timed question's frame tells its renderers: when to play the prompt, when to record, and where to report. */
export interface TimedRendererControl {
  /** The prompt audio should play now (once, without controls). */
  playPrompt: boolean;
  /** Start or stop the microphone; null leaves the recorder alone. */
  recordCommand: "start" | "stop" | null;
  /** Hard cap of the recording in seconds (the pinned response time). */
  maxSeconds: number;
  onPromptEnded: () => void;
  /** The browser refused autoplay: ask for a gesture again. */
  onPromptBlocked: () => void;
  /** The prompt audio failed to load before it played; the frame refreshes the link and tries again. */
  onPromptError: () => void;
  onRecordStarted: () => void;
  onSaved: () => void;
  onSaveFailed: () => void;
  onMicError: () => void;
}

export interface TaskRendererProps {
  fixture: PracticeTaskFixture;
  rendererKey?: string | null;
  value: Record<string, unknown>;
  disabled?: boolean;
  onChange: (value: Record<string, unknown>) => void;
  onUploadRecording?: (blob: Blob, durationSeconds: number) => Promise<RecordedPracticeMedia>;
  /** Resolves a fresh, short-lived link to the saved recording of this item, for replay after a reload. */
  onLoadPlayback?: () => Promise<string>;
  /** Present only for a timed question; an untimed one renders exactly as before. */
  timed?: TimedRendererControl;
  sessionPublicId?: string;
  itemPublicId?: string;
}
