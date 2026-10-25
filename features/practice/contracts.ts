import { asArray, asNullableNumber, asNullableString, asNumber, asRecord, asString } from "./contract-helpers";
import { normalizeSessionStatus, type PracticeSessionItemStatus, type PracticeSessionStatus } from "./session-contracts";
import type { PracticeTaskContentOption } from "./session-contracts";
import type { EstimatedScores } from "../mockTests/mock-test-contracts";

// Catalog and session contracts live in their own files; they are re-exported so existing imports keep working.
export * from "./catalog-contracts";
export * from "./session-contracts";

export type EntitlementState = "UNLOCKED" | "LOCKED" | "AMBIGUOUS" | "UNAVAILABLE" | "UNKNOWN";
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

export interface PracticeReviewItem {
  publicId: string;
  orderIndex: number;
  taskCode: string;
  displayName: string;
  section: string;
  status: PracticeSessionItemStatus;
  promptText: string | null;
  savedPayload: string | null;
  rendererKey: string | null;
  options: PracticeTaskContentOption[];
}

export interface PracticeReview {
  sessionPublicId: string;
  items: PracticeReviewItem[];
  /** Reference 10-90 estimate; only a finished mock test has one. */
  estimatedScores: EstimatedScores | null;
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
