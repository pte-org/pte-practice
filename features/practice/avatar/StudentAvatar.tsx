"use client";

import Image from "next/image";
import type { ReactElement } from "react";
import { AVATAR_IMAGES, type AvatarGender } from "./avatar";
import { useStudentAvatar } from "./StudentAvatarProvider";

const AVATAR_PIXELS = 68;

interface StudentAvatarProps {
  className?: string;
  /** Draw this one instead of the student's own, for the picker's options. */
  gender?: AvatarGender;
}

/** The round avatar picture. Decorative: the name and e-mail next to it say who it is. */
export const StudentAvatar = ({ className, gender }: StudentAvatarProps): ReactElement => {
  const own = useStudentAvatar().gender;
  return (
    <Image className={className} src={AVATAR_IMAGES[gender ?? own]} alt="" aria-hidden="true"
      width={AVATAR_PIXELS} height={AVATAR_PIXELS} />
  );
};
