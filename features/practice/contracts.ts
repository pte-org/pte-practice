import { allowlistedRendererKey, isClientRuntimeSupported } from "./renderer-allowlist";

export type EntitlementState = "UNLOCKED" | "LOCKED" | "AMBIGUOUS" | "UNAVAILABLE" | "UNKNOWN";
export type CatalogAvailability = "RUNNABLE" | "VISIBLE" | "UNAVAILABLE";
export type PracticeSessionStatus = "OVERVIEW" | "IN_PROGRESS" | "COMPLETED" | "DISCARDED" | "EXPIRED";
export type PracticeSessionItemStatus = "PENDING" | "ANSWERED" | "SKIPPED";
export type ResponseConfidence = "LOW" | "MEDIUM" | "HIGH";
export type PracticeProgressStatus =
  | "IN_PROGRESS"
  | "COMPLETED_PENDING_SCORE"
  | "COMPLETED_SCORED"
  | "SCORING_FAILED";

export interface PracticeSessionTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  mustChangePassword: boolean;
  expiresAt?: number;
}

export interface PracticeEntitlement {
  student: { publicId: string | null; status: string } | null;
  organizationContext: OrganizationContext | null;
  availableOrganizations: OrganizationContext[];
  practice: { state: EntitlementState };
  refreshAt: string | null;
}

export interface OrganizationContext {
  publicId: string;
  displayName: string;
  organizationType: string;
}

export interface PracticeCatalogTask {
  code: string;
  displayName: string;
  section: string;
  scored: boolean;
  availability: CatalogAvailability;
  unavailableReason: string | null;
  profileKey: string | null;
  profileVersion: number | null;
  rendererKey: string | null;
  contractVersion: number | null;
  answerSchemaVersion: number | null;
  requiredClientCapabilities: string[];
  contentStatus: string | null;
  provenance: string | null;
}

export interface PracticeCatalogSection {
  code: string;
  displayName: string;
  taskTypes: PracticeCatalogTask[];
}

export interface PracticeCatalog {
  productCode: string;
  title: string;
  catalogVersion: string;
  timeLimitSeconds: number;
  sections: PracticeCatalogSection[];
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
}

export interface PracticeSession {
  publicId: string;
  sourceType: string;
  productCode: string;
  title: string;
  organizationId: string;
  catalogVersion: string;
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
}

export interface PracticeProgressEntry {
  sessionPublicId: string;
  productCode: string;
  title: string;
  status: PracticeProgressStatus;
  sessionStatus: PracticeSessionStatus;
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
  answeredItemCount: number;
  draftItemCount: number;
  skippedItemCount: number;
  totalItemCount: number;
  lowConfidenceCount: number;
  mediumConfidenceCount: number;
  highConfidenceCount: number;
  score: number | null;
}

export interface PracticeProgress {
  entries: PracticeProgressEntry[];
  totalSessions: number;
  completedSessions: number;
  answeredItems: number;
  totalItems: number;
  generatedAt: string | null;
  hasMore: boolean;
}

export interface PracticeChallenge {
  challengeId: string;
  expiresAt: string;
}

export function normalizeEntitlementResponse(value: unknown): PracticeEntitlement {
  const record = asRecord(value);
  const student = asRecord(record.student);
  const practice = asRecord(record.practice);
  const state = normalizeEntitlementState(practice.state);

  return {
    student: student
      ? {
          publicId: asNullableString(student.publicId),
          status: asString(student.status, "UNKNOWN"),
        }
      : null,
    organizationContext: normalizeOrganization(record.organizationContext),
    availableOrganizations: asArray(record.availableOrganizations)
      .map(normalizeOrganization)
      .filter((organization): organization is OrganizationContext => organization !== null),
    practice: { state },
    refreshAt: asNullableString(record.refreshAt),
  };
}

export function normalizeCatalogResponse(value: unknown): PracticeCatalog | null {
  const record = asRecord(value);
  const sections = asArray(record.sections)
    .map(normalizeCatalogSection)
    .filter((section): section is PracticeCatalogSection => section !== null);

  if (!asString(record.productCode, "") || sections.length === 0) return null;

  return {
    productCode: asString(record.productCode, "PTE_CORE_PRACTICE"),
    title: asString(record.title, "PTE Practice"),
    catalogVersion: asString(record.catalogVersion, "unknown"),
    timeLimitSeconds: asNumber(record.timeLimitSeconds, 0),
    sections,
  };
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
  };
}

export function normalizePracticeProgressResponse(value: unknown): PracticeProgress {
  const record = asRecord(value);
  const entries = asArray(record.entries)
    .map(normalizeProgressEntry)
    .filter((entry): entry is PracticeProgressEntry => entry !== null);
  return {
    entries,
    totalSessions: asNumber(record.totalSessions, entries.length),
    completedSessions: asNumber(record.completedSessions,
      entries.filter((entry) => entry.status !== "IN_PROGRESS").length),
    answeredItems: asNumber(record.answeredItems,
      entries.reduce((total, entry) => total + entry.answeredItemCount, 0)),
    totalItems: asNumber(record.totalItems,
      entries.reduce((total, entry) => total + entry.totalItemCount, 0)),
    generatedAt: asNullableString(record.generatedAt),
    hasMore: Boolean(record.hasMore),
  };
}

export function canStartPractice(
  entitlementState: EntitlementState | null,
  task: Pick<PracticeCatalogTask, "availability" | "rendererKey">,
): boolean {
  return entitlementState === "UNLOCKED" && task.availability === "RUNNABLE"
    && isClientRuntimeSupported(task.rendererKey);
}

function normalizeCatalogSection(value: unknown): PracticeCatalogSection | null {
  const record = asRecord(value);
  const taskTypes = asArray(record.taskTypes)
    .map(normalizeCatalogTask)
    .filter((task): task is PracticeCatalogTask => task !== null);
  const code = asString(record.code, "");
  if (!code || taskTypes.length === 0) return null;
  return {
    code,
    displayName: asString(record.displayName, humanize(code)),
    taskTypes,
  };
}

function normalizeCatalogTask(value: unknown): PracticeCatalogTask | null {
  const record = asRecord(value);
  const code = asString(record.code, "");
  if (!code) return null;
  return {
    code,
    displayName: asString(record.displayName, humanize(code)),
    section: asString(record.section, "UNKNOWN"),
    scored: Boolean(record.scored),
    availability: normalizeAvailability(record.availability),
    unavailableReason: asNullableString(record.unavailableReason),
    profileKey: asNullableString(record.profileKey),
    profileVersion: asNullableNumber(record.profileVersion),
    rendererKey: allowlistedRendererKey(record.rendererKey),
    contractVersion: asNullableNumber(record.contractVersion),
    answerSchemaVersion: asNullableNumber(record.answerSchemaVersion),
    requiredClientCapabilities: asArray(record.requiredClientCapabilities).filter(
      (capability): capability is string => typeof capability === "string",
    ),
    contentStatus: asNullableString(record.contentStatus),
    provenance: asNullableString(record.provenance),
  };
}

function normalizeOrganization(value: unknown): OrganizationContext | null {
  const record = asRecord(value);
  const publicId = asString(record.publicId, "");
  if (!publicId) return null;
  return {
    publicId,
    displayName: asString(record.displayName, "Organization"),
    organizationType: asString(record.organizationType, "Organization"),
  };
}

function normalizeEntitlementState(value: unknown): EntitlementState {
  if (value === "UNLOCKED" || value === "LOCKED" || value === "AMBIGUOUS" || value === "UNAVAILABLE") {
    return value;
  }
  return "UNKNOWN";
}

function normalizeAvailability(value: unknown): CatalogAvailability {
  if (value === "RUNNABLE" || value === "VISIBLE" || value === "UNAVAILABLE") return value;
  return "UNAVAILABLE";
}

function normalizeSessionStatus(value: unknown): PracticeSessionStatus | null {
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
  };
}

function normalizeProgressEntry(value: unknown): PracticeProgressEntry | null {
  const record = asRecord(value);
  const sessionPublicId = asString(record.sessionPublicId, "");
  const status = record.status === "IN_PROGRESS" || record.status === "COMPLETED_PENDING_SCORE"
    || record.status === "COMPLETED_SCORED" || record.status === "SCORING_FAILED"
    ? record.status : null;
  const sessionStatus = normalizeSessionStatus(record.sessionStatus);
  if (!sessionPublicId || !status || !sessionStatus) return null;
  return {
    sessionPublicId,
    productCode: asString(record.productCode, "PTE_CORE_PRACTICE"),
    title: asString(record.title, "PTE Practice"),
    status,
    sessionStatus,
    startedAt: asNullableString(record.startedAt),
    completedAt: asNullableString(record.completedAt),
    lastActivityAt: asNullableString(record.lastActivityAt),
    answeredItemCount: asNumber(record.answeredItemCount, 0),
    draftItemCount: asNumber(record.draftItemCount, 0),
    skippedItemCount: asNumber(record.skippedItemCount, 0),
    totalItemCount: asNumber(record.totalItemCount, 0),
    lowConfidenceCount: asNumber(record.lowConfidenceCount, 0),
    mediumConfidenceCount: asNumber(record.mediumConfidenceCount, 0),
    highConfidenceCount: asNumber(record.highConfidenceCount, 0),
    score: asNullableNumber(record.score),
  };
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
