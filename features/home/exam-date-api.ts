import { API_PATHS } from "@/features/practice/constants";
import { practiceRequest } from "@/features/practice/api";

export interface StudentProfile {
  examDate: string | null;
}

/** Validates and normalizes raw profile API response; only accepts YYYY-MM-DD or null. */
export function parseProfileResponse(raw: unknown): StudentProfile {
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const examDate = typeof obj.examDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.examDate)
      ? obj.examDate
      : null;
    return { examDate };
  }
  return { examDate: null };
}

/** Fetches student practice profile containing planned exam date. */
export async function fetchProfile(): Promise<StudentProfile> {
  const data = await practiceRequest<unknown>(API_PATHS.profile);
  return parseProfileResponse(data);
}

/** Sets or clears (when examDate is null) the planned exam date. */
export async function saveProfile(examDate: string | null): Promise<StudentProfile> {
  const data = await practiceRequest<unknown>(API_PATHS.profile, {
    method: "PUT",
    body: { examDate },
  });
  return parseProfileResponse(data);
}
