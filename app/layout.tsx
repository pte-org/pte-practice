import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/common/providers/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/common/providers/theme-init";
import { LocaleProvider } from "@/common/i18n";

export const metadata: Metadata = {
  title: {
    default: "PTE Practice",
    template: "%s · PTE Practice",
  },
  description: "Student practice workspace for PTE preparation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
