import { practiceRequest } from "@/features/practice/api";
import { API_PATHS } from "@/features/practice/constants";
import { parseAvatarGender, type AvatarGender } from "./avatar";

/** The avatar the student picked, or null when they have not. Its own call, apart from the exam-date profile code. */
export async function fetchAvatarGender(): Promise<AvatarGender | null> {
  return parseAvatarGender(await practiceRequest<unknown>(API_PATHS.profile));
}

/** Saves the avatar through its own endpoint, which has no way to touch the exam date. */
export async function saveAvatarGender(gender: AvatarGender): Promise<AvatarGender | null> {
  const saved = await practiceRequest<unknown>(API_PATHS.profileAvatar, { method: "PUT", body: { gender } });
  return parseAvatarGender(saved);
}
