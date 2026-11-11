import { PRACTICE_ROUTES } from "@/features/practice/constants";

/** The query parameter carrying the page to return to after signing in. */
export const RETURN_PATH_PARAM = "next";

/** The sign-in address that brings the student back to {@code path} afterwards. */
export function signInHref(path: string): string {
  return isAppPath(path) && path !== PRACTICE_ROUTES.home
    ? `${PRACTICE_ROUTES.signIn}?${RETURN_PATH_PARAM}=${encodeURIComponent(path)}`
    : PRACTICE_ROUTES.signIn;
}

/** Where to go after signing in: the requested page of this app, or home. Other sites are never followed. */
export function returnPath(search: string): string {
  const requested = new URLSearchParams(search).get(RETURN_PATH_PARAM);
  return requested && isAppPath(requested) && !requested.startsWith(PRACTICE_ROUTES.signIn)
    ? requested : PRACTICE_ROUTES.home;
}

// One leading slash only: "//host" and "/\\host" are read by browsers as another site.
function isAppPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\");
}
