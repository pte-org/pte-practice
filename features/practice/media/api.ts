import { PracticeApiError, type PracticeApiClient } from "../api";
import { PRACTICE_RESPONSE_AUDIO_PURPOSE, RECORDING_TEXT } from "./constants";
import type { RecordedPracticeMedia } from "./contracts";

const AUDIO_CONTENT_TYPE = "audio/wav" as const;
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 30_000;

export async function uploadPracticeRecording(client: PracticeApiClient, blob: Blob,
  sessionPublicId: string, itemPublicId: string, durationSeconds: number): Promise<RecordedPracticeMedia> {
  const grant = await client.requestResponseAudio({
    contentType: AUDIO_CONTENT_TYPE,
    assetKind: "STUDENT_RESPONSE_AUDIO",
    sizeBytes: blob.size,
    practiceSessionId: sessionPublicId,
    practiceItemId: itemPublicId,
    purpose: PRACTICE_RESPONSE_AUDIO_PURPOSE,
  });

  let uploaded: Record<string, unknown>;
  try {
    const form = new FormData();
    form.append("file", blob, "practice-response.wav");
    form.append("api_key", grant.apiKey);
    form.append("timestamp", grant.timestamp);
    form.append("signature", grant.signature);
    form.append("folder", grant.folder);
    form.append("public_id", grant.publicId.split("/").pop() ?? grant.publicId);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CLOUDINARY_UPLOAD_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(grant.uploadUrl, { method: "POST", body: form, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
    const body = await parseJson(response);
    if (!response.ok) throw new PracticeApiError(RECORDING_TEXT.uploadFailed, response.status, "MEDIA_UPLOAD_FAILED");
    uploaded = asRecord(body);
  } catch (error) {
    if (error instanceof PracticeApiError) throw error;
    throw new PracticeApiError(RECORDING_TEXT.uploadFailed, 0, "MEDIA_UPLOAD_FAILED");
  }

  const secureUrl = asString(uploaded.secure_url);
  const publicId = asString(uploaded.public_id);
  const assetId = asString(uploaded.asset_id);
  const resourceType = asString(uploaded.resource_type);
  const signature = asString(uploaded.signature);
  const version = asNumber(uploaded.version);
  const bytes = asNumber(uploaded.bytes) || blob.size;
  if (!secureUrl || !publicId || !assetId || !resourceType || !signature || !version) {
    throw new PracticeApiError(RECORDING_TEXT.uploadFailed, 502, "MEDIA_UPLOAD_INVALID_RESPONSE");
  }

  await client.completeResponseAudio(grant.mediaPublicId, {
    publicId,
    assetId,
    secureUrl,
    resourceType,
    format: asString(uploaded.format) ?? undefined,
    bytes,
    durationSeconds,
    version,
    signature,
  });
  return { mediaPublicId: grant.mediaPublicId, durationSeconds, contentType: AUDIO_CONTENT_TYPE };
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  const record = value as Record<string, unknown>;
  if (record.success === true && typeof record.data === "object" && record.data !== null) {
    return record.data as Record<string, unknown>;
  }
  return record;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
