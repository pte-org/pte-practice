import { asArray, asNullableNumber, asNumber, asRecord, asString } from "@/features/practice/contract-helpers";

export type MockAttemptStatus = "OVERVIEW" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";

export interface MockTestAttempt {
  sessionPublicId: string;
  status: MockAttemptStatus;
  answeredItemCount: number;
  totalItemCount: number;
  /** 10-90 reference estimate, only once the attempt is complete and scored. */
  estimatedOverall: number | null;
}

export interface MockTest {
  publicId: string;
  title: string;
  sequenceNo: number;
  itemCount: number;
  estimatedMinutes: number;
  latestAttempt: MockTestAttempt | null;
}

/** Reference-only 10-90 estimate of a finished mock test; a skill is null until it has a scored task type. */
export interface EstimatedScores {
  overall: number | null;
  speaking: number | null;
  writing: number | null;
  reading: number | null;
  listening: number | null;
  skippedItemCount: number;
  excludedItemCount: number;
  pending: boolean;
}

function normalizeStatus(value: unknown): MockAttemptStatus | null {
  return value === "OVERVIEW" || value === "IN_PROGRESS" || value === "COMPLETED" || value === "EXPIRED" ? value : null;
}

function normalizeAttempt(value: unknown): MockTestAttempt | null {
  const record = asRecord(value);
  const status = normalizeStatus(record.status);
  const sessionPublicId = asString(record.sessionPublicId, "");
  if (!status || !sessionPublicId) return null;
  return {
    sessionPublicId,
    status,
    answeredItemCount: Math.max(0, asNumber(record.answeredItemCount, 0)),
    totalItemCount: Math.max(0, asNumber(record.totalItemCount, 0)),
    estimatedOverall: asNullableNumber(record.estimatedOverall),
  };
}

export function normalizeMockTests(value: unknown): MockTest[] {
  return asArray(value).flatMap((entry) => {
    const record = asRecord(entry);
    const publicId = asString(record.publicId, "");
    if (!publicId) return [];
    const sequenceNo = asNumber(record.sequenceNo, 0);
    return [{
      publicId,
      title: asString(record.title, `PTE Academic Full Mock Test ${sequenceNo}`),
      sequenceNo,
      itemCount: Math.max(0, asNumber(record.itemCount, 0)),
      estimatedMinutes: Math.max(0, asNumber(record.estimatedMinutes, 0)),
      latestAttempt: normalizeAttempt(record.latestAttempt),
    }];
  });
}

export function normalizeEstimatedScores(value: unknown): EstimatedScores | null {
  if (typeof value !== "object" || value === null) return null;
  const record = asRecord(value);
  return {
    overall: asNullableNumber(record.overall),
    speaking: asNullableNumber(record.speaking),
    writing: asNullableNumber(record.writing),
    reading: asNullableNumber(record.reading),
    listening: asNullableNumber(record.listening),
    skippedItemCount: Math.max(0, asNumber(record.skippedItemCount, 0)),
    excludedItemCount: Math.max(0, asNumber(record.excludedItemCount, 0)),
    pending: record.pending === true,
  };
}
