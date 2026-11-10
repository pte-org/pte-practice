export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
  /** The caller's own session: the server keeps it and signs every other session out. */
  refreshToken?: string;
}

export function buildChangePasswordBody(
  currentPassword: string,
  newPassword: string,
  session: { refreshToken: string } | null,
): ChangePasswordBody {
  return session
    ? { currentPassword, newPassword, refreshToken: session.refreshToken }
    : { currentPassword, newPassword };
}
