import { normalizeCatalogSection, type PracticeCatalogSection } from "./catalog-contracts";
import {
  asArray, asNullableNumber, asNullableString, asNumber, asRecord, asString, humanize,
} from "./contract-helpers";
import { allowlistedRendererKey } from "./renderer-allowlist";

export type PracticeSessionStatus = "OVERVIEW" | "IN_PROGRESS" | "COMPLETED" | "DISCARDED" | "EXPIRED";
export type PracticeSessionItemStatus = "PENDING" | "ANSWERED" | "SKIPPED";
export type ResponseConfidence = "LOW" | "MEDIUM" | "HIGH";
/** TIMED follows the exam rhythm per item; UNTIMED has no countdown. Sessions from before the choice read as UNTIMED. */
export type PracticeTimingMode = "TIMED" | "UNTIMED";

/**
 * Body of "start a session". Name one thing to practise: task types, a skill (all its task types), or a mock test.
 * Omitted timing mode means untimed with the server's default question count.
 */
export interface StartSessionRequest {
  productCode: string;
  organizationId: string;
  taskTypeCodes?: string[];
  skillCode?: string;
  mockTestId?: string;
  /** With a mock test: abandon an unfinished attempt and begin again. */
  restart?: boolean;
  capabilities: { supportedCapabilities: string[]; appVersion: string };
  timingMode?: PracticeTimingMode;
  questionCount?: number;
}

/**
 * Per-item pacing pinned when a TIMED session begins. {@code preRecordSeconds} is the template's gap before
 * recording only: the client waits for the prompt audio to finish, so nothing sums the three on the server.
 */
export interface PracticeItemTiming {
  preListenSeconds: number | null;
  preRecordSeconds: number;
  responseSeconds: number;
}

export interface PracticeTaskContentOption {
  publicId?: string | null;
  text: string;
  orderIndex: number;
  blankIndex: number | null;
}

export interface PracticeTaskContent {
  promptText: string | null;
  minWordCount: number | null;
  maxWordCount: number | null;
  audioPromptRef?: string | null;
  imagePromptRef?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  options: PracticeTaskContentOption[];
}

export type PracticeScoringState = "NONE" | "SCORING" | "SCORED" | "FAILED";

export interface PracticeItemResult {
  itemPublicId: string;
  taskCode: string;
  state: PracticeScoringState;
  score: number | null;
  scoreStatus: string | null;
  subScores: Record<string, number>;
  feedback: string | null;
  transcript: string | null;
  failureCode: string | null;
  retryable: boolean;
  scoredAt: string | null;
}

export interface PracticeTaskResponse {
  publicId: string;
  orderIndex: number;
  taskCode: string;
  displayName: string;
  section: string;
  rendererKey: string | null;
  contractVersion: number | null;
  answerSchemaVersion: number | null;
  status: PracticeSessionItemStatus;
  savedPayload: string | null;
  confidence: ResponseConfidence | null;
  content: PracticeTaskContent | null;
  /** Present only for items of a TIMED session. */
  timing: PracticeItemTiming | null;
}

export interface PracticeSession {
  publicId: string;
  sourceType: string;
  productCode: string;
  title: string;
  organizationId: string;
  catalogVersion: string;
  /** Deprecated: always 0 since sessions have no overall limit; use {@link timingMode}. */
  timeLimitSeconds: number;
  status: PracticeSessionStatus;
  version: number;
  startedAt: string | null;
  deadlineAt: string | null;
  completedAt: string | null;
  discardedAt: string | null;
  saveAndExitAvailable: boolean;
  canAdvance: boolean;
  nextAction: string | null;
  answeredItemCount: number;
  totalItemCount: number;
  sections: PracticeCatalogSection[];
  currentTask: PracticeTaskResponse | null;
  itemResult: PracticeItemResult | null;
  timingMode: PracticeTimingMode;
  /** Questions per task type the student asked for; null for sessions from before the choice existed. */
  questionCount: number | null;
}

/** Short-lived link to the student's own saved recording, to replay it and draw its waveform after a reload. */
export interface PracticeRecordingPlayback {
  url: string;
  expiresInSeconds: number;
  durationSeconds: number | null;
}

export function normalizePracticeSessionResponse(value: unknown): PracticeSession | null {
  const record = asRecord(value);
  const publicId = asString(record.publicId, "");
  const status = normalizeSessionStatus(record.status);
  if (!publicId || !status) return null;

  return {
    publicId,
    sourceType: asString(record.sourceType, "PRACTICE"),
    productCode: asString(record.productCode, "PTE_CORE_PRACTICE"),
    title: asString(record.title, "PTE Practice"),
    organizationId: asString(record.organizationId, ""),
    catalogVersion: asString(record.catalogVersion, "unknown"),
    timeLimitSeconds: asNumber(record.timeLimitSeconds, 0),
    status,
    version: asNumber(record.version, 0),
    startedAt: asNullableString(record.startedAt),
    deadlineAt: asNullableString(record.deadlineAt),
    completedAt: asNullableString(record.completedAt),
    discardedAt: asNullableString(record.discardedAt),
    saveAndExitAvailable: Boolean(record.saveAndExitAvailable),
    canAdvance: Boolean(record.canAdvance),
    nextAction: asNullableString(record.nextAction),
    answeredItemCount: asNumber(record.answeredItemCount, 0),
    totalItemCount: asNumber(record.totalItemCount, 0),
    sections: asArray(record.sections)
      .map(normalizeCatalogSection)
      .filter((section): section is PracticeCatalogSection => section !== null),
    currentTask: normalizePracticeTask(record.currentTask),
    itemResult: normalizePracticeItemResult(record.itemResult),
    timingMode: record.timingMode === "TIMED" ? "TIMED" : "UNTIMED",
    questionCount: asNullableNumber(record.questionCount),
  };
}

export function normalizeRecordingPlayback(value: unknown): PracticeRecordingPlayback | null {
  const record = asRecord(value);
  const url = asString(record.url, "");
  if (!url) return null;
  return {
    url,
    expiresInSeconds: asNumber(record.expiresInSeconds, 0),
    durationSeconds: asNullableNumber(record.durationSeconds),
  };
}

export function normalizePracticeItemResult(value: unknown): PracticeItemResult | null {
  const record = asRecord(value);
  const itemPublicId = asString(record.itemPublicId, "");
  const state = record.state === "NONE" || record.state === "SCORING" || record.state === "SCORED"
    || record.state === "FAILED" ? record.state : null;
  if (!itemPublicId || !state) return null;
  return {
    itemPublicId,
    taskCode: asString(record.taskCode, ""),
    state,
    score: asNullableNumber(record.score),
    scoreStatus: asNullableString(record.scoreStatus),
    subScores: normalizeSubScores(record.subScores),
    feedback: asNullableString(record.feedback),
    transcript: asNullableString(record.transcript),
    failureCode: asNullableString(record.failureCode),
    retryable: Boolean(record.retryable),
    scoredAt: asNullableString(record.scoredAt),
  };
}

export function normalizeSubScores(value: unknown): Record<string, number> {
  return Object.fromEntries(Object.entries(asRecord(value))
    .filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])));
}

export function normalizeSessionStatus(value: unknown): PracticeSessionStatus | null {
  if (value === "OVERVIEW" || value === "IN_PROGRESS" || value === "COMPLETED"
    || value === "DISCARDED" || value === "EXPIRED") return value;
  return null;
}

function normalizePracticeTask(value: unknown): PracticeTaskResponse | null {
  const record = asRecord(value);
  const publicId = asString(record.publicId, "");
  const taskCode = asString(record.taskCode, "");
  const status = record.status === "PENDING" || record.status === "ANSWERED" || record.status === "SKIPPED"
    ? record.status
    : null;
  if (!publicId || !taskCode || !status) return null;
  const confidence = record.confidence === "LOW" || record.confidence === "MEDIUM" || record.confidence === "HIGH"
    ? record.confidence
    : null;
  return {
    publicId,
    orderIndex: asNumber(record.orderIndex, 0),
    taskCode,
    displayName: asString(record.displayName, humanize(taskCode)),
    section: asString(record.section, "UNKNOWN"),
    rendererKey: allowlistedRendererKey(record.rendererKey),
    contractVersion: asNullableNumber(record.contractVersion),
    answerSchemaVersion: asNullableNumber(record.answerSchemaVersion),
    status,
    savedPayload: asNullableString(record.savedPayload),
    confidence,
    content: normalizePracticeTaskContent(record.content),
    timing: normalizeItemTiming(record.timing),
  };
}

function normalizeItemTiming(value: unknown): PracticeItemTiming | null {
  const record = asRecord(value);
  const responseSeconds = asNullableNumber(record.responseSeconds);
  if (responseSeconds === null || responseSeconds <= 0) return null;
  return {
    preListenSeconds: asNullableNumber(record.preListenSeconds),
    preRecordSeconds: Math.max(asNumber(record.preRecordSeconds, 0), 0),
    responseSeconds,
  };
}

function normalizePracticeTaskContent(value: unknown): PracticeTaskContent | null {
  if (value === null || value === undefined) return null;
  const record = asRecord(value);
  const promptText = asNullableString(record.promptText);
  const options: PracticeTaskContentOption[] = asArray(record.options)
    .flatMap((option) => {
      const item = asRecord(option);
      const text = asNullableString(item.text);
      if (!text) return [];
      return [{
        text,
        publicId: asNullableString(item.publicId),
        orderIndex: asNumber(item.orderIndex, 0),
        blankIndex: asNullableNumber(item.blankIndex),
      }];
    });
  const audioPromptRef = asNullableString(record.audioPromptRef);
  const imagePromptRef = asNullableString(record.imagePromptRef);
  const audioUrl = asNullableString(record.audioUrl);
  const imageUrl = asNullableString(record.imageUrl);
  if (!promptText && options.length === 0 && !audioPromptRef && !imagePromptRef && !audioUrl && !imageUrl) return null;
  return {
    promptText,
    minWordCount: asNullableNumber(record.minWordCount),
    maxWordCount: asNullableNumber(record.maxWordCount),
    audioPromptRef,
    imagePromptRef,
    audioUrl,
    imageUrl,
    options,
  };
}
