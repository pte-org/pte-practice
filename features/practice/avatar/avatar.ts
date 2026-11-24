/** The two avatars a student can pick; the server stores the same names. */
export const AVATAR_GENDERS = ["MALE", "FEMALE"] as const;
export type AvatarGender = (typeof AVATAR_GENDERS)[number];

/** What a student who has not picked yet sees. */
export const DEFAULT_AVATAR_GENDER: AvatarGender = "MALE";

export const AVATAR_IMAGES: Readonly<Record<AvatarGender, string>> = {
  MALE: "/avatars/male.png",
  FEMALE: "/avatars/female.png",
};

/** Reads the avatar out of a profile response; anything that is not one of the two names counts as not picked. */
export function parseAvatarGender(raw: unknown): AvatarGender | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = (raw as Record<string, unknown>).gender;
  return AVATAR_GENDERS.find((gender) => gender === value) ?? null;
}
