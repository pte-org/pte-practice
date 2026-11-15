"use client";

import "./globals.css";
import "@/common/components/button.css";
import { ErrorPage } from "@/common/components";
import { LocaleProvider } from "@/common/i18n";
import { THEME_INIT_SCRIPT } from "@/common/providers/theme-init";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

/** Replaces the root layout when it fails, so it brings its own document, styles, theme and language. */
export default function GlobalError({ unstable_retry }: GlobalErrorProps) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <LocaleProvider>
          <ErrorPage kind="server" onRetry={unstable_retry} fullScreen />
        </LocaleProvider>
      </body>
    </html>
  );
}
