import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/common/components/button.css";
import { ThemeProvider } from "@/common/providers/ThemeProvider";
import { THEME_INIT_SCRIPT } from "@/common/providers/theme-init";
import { LocaleProvider } from "@/common/i18n";
import { ToastProvider } from "@/common/components";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PTE Practice",
    template: "%s · PTE Practice",
  },
  description: "Student practice workspace for PTE preparation.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo-ppte.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <ToastProvider>{children}</ToastProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
