"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useTranslation, type TranslationKey } from "@/common/i18n";
import { AppIcon } from "./AppIcon";
import { ErrorIllustration } from "./ErrorIllustration";

/** What went wrong, which picks the title, the text and the status code shown. */
export type ErrorPageKind = "notFound" | "unauthorized" | "forbidden" | "server" | "unavailable" | "network" | "generic";

interface ErrorPageProps {
  kind?: ErrorPageKind;
  /** Replaces the text of the kind, e.g. the message of a failed session command. */
  description?: string;
  /** Shown when the page can be loaded again; its label defaults to "Try again". */
  onRetry?: () => void;
  retryLabel?: string;
  /** Leaves through this handler (e.g. to check unsaved recordings) instead of a plain link home. */
  onHome?: () => void;
  /** Replaces the way home, e.g. the sign-in page for a signed-out student. */
  action?: { href: string; label: string };
  /** Fills the screen (not-found and global errors) instead of the content area. */
  fullScreen?: boolean;
  testId?: string;
}

const STATUS_CODES: Partial<Record<ErrorPageKind, string>> = {
  notFound: "404",
  unauthorized: "401",
  forbidden: "403",
  server: "500",
  unavailable: "503",
};

const HOME_HREF = "/";

/** Reads the kind from an API error's HTTP status (0 means the request never reached the server). */
export function errorPageKindOf(error: unknown): ErrorPageKind {
  const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
  if (typeof status !== "number") return "generic";
  if (status === 0) return "network";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 503) return "unavailable";
  return status >= 500 ? "server" : "generic";
}

/** The error page of the practice app: the illustration, a title and text for the kind, and the way back home. */
export function ErrorPage({ kind = "generic", description, onRetry, retryLabel, onHome, action, fullScreen = false, testId }: ErrorPageProps): ReactElement {
  const { t } = useTranslation();
  const code = STATUS_CODES[kind];
  const homeContent = <><AppIcon name="chevronLeft" size={16} />{t("errorPage.home")}</>;
  const homeClass = "button button-primary button-pill";

  return (
    <main className={fullScreen ? "error-page-shell error-page-shell-full" : "error-page-shell"} data-testid={testId}>
      <section className="error-page-card">
        <div className="error-page-art"><ErrorIllustration className="error-page-illustration" /></div>
        <div className="error-page-text">
          {code ? <p className="error-page-code">{code}</p> : null}
          <h1>{t(`errorPage.${kind}Title` as TranslationKey)}</h1>
          <p>{description ?? t(`errorPage.${kind}Description` as TranslationKey)}</p>
        </div>
        <div className="error-page-actions">
          {onRetry ? (
            <button className="button button-outline button-pill" type="button" onClick={onRetry}>
              {retryLabel ?? t("errorPage.retry")}
            </button>
          ) : null}
          {action ? (
            <Link className={homeClass} href={action.href}>{action.label}</Link>
          ) : onHome ? (
            <button className={homeClass} type="button" onClick={onHome}>{homeContent}</button>
          ) : (
            <Link className={homeClass} href={HOME_HREF}>{homeContent}</Link>
          )}
        </div>
      </section>
    </main>
  );
}
