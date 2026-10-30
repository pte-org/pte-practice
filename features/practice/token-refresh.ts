let inFlight: Promise<boolean> | null = null;

/**
 * Runs one token refresh at a time: requests that hit 401 together share the same refresh instead of each spending
 * the (single-use) refresh token, which would make every refresh after the first fail and sign the student out.
 */
export function refreshOnce(refreshToken: string, doRefresh: (token: string) => Promise<boolean>): Promise<boolean> {
  if (!inFlight) {
    inFlight = doRefresh(refreshToken).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
