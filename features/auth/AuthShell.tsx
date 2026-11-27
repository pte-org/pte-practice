"use client";

import Image from "next/image";
import { Suspense, type ReactElement, type ReactNode } from "react";
import { AppIcon } from "@/common/components";
import { useTranslation } from "@/common/i18n";
import { useTheme } from "@/common/providers/ThemeProvider";
import { AuthBackdrop } from "./AuthBackdrop";
import { BRAND_NAME } from "./constants";
import { OrbitPanel } from "./OrbitPanel";
import "./sign-in.css";

const LOGO_WIDTH = 482;
const LOGO_HEIGHT = 567;

interface AuthShellProps { children: ReactNode }

/** The signed-out page: backdrop, language and theme switches, brand card and footer around one form. */
export const AuthShell = ({ children }: AuthShellProps): ReactElement => {
  const { t, locale, setLocale } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  return (
    <main className="sign-in-page">
      <AuthBackdrop />
      <div className="sign-in-toolbar">
        <div className="locale-control">
          <select className="icon-button locale-button" value={locale}
            onChange={(event) => setLocale(event.target.value === "vi" ? "vi" : "en")}
            aria-label={t("auth.toggleLanguage")} title={t("auth.toggleLanguage")}>
            <option value="vi">VI</option>
            <option value="en">EN</option>
          </select>
          <AppIcon name="chevronDown" size={16} />
        </div>
        <button className="icon-button theme-button" type="button" onClick={toggleTheme}
          aria-label={t("auth.toggleTheme")} title={t("auth.toggleTheme")} aria-pressed={theme === "dark"}>
          <AppIcon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
      </div>

      <div className="sign-in-stage">
        <div className="sign-in-card">
          <OrbitPanel title={t("auth.showcaseLabel")} />
          <div className="sign-in-column">
            <div className="sign-in-brand">
              <Image src="/logo-mark.png" alt="" width={LOGO_WIDTH} height={LOGO_HEIGHT} priority className="sign-in-logo" />
              <span>
                <strong>{BRAND_NAME.prefix} {BRAND_NAME.suffix}</strong>
                <small>{t("auth.brandTagline")}</small>
              </span>
            </div>
            <div className="sign-in-body">{children}</div>
          </div>
        </div>
      </div>
      <footer className="sign-in-footer">
        <nav aria-label={t("auth.footerLabel")}>
          <ul>
            <li><Suspense fallback={null}><CopyrightYear /></Suspense></li>
            <li>{t("auth.footerTerms")}</li>
            <li>{t("auth.footerPrivacy")}</li>
            <li>{t("auth.footerSupport")}</li>
          </ul>
        </nav>
      </footer>
    </main>
  );
};

const CopyrightYear = (): ReactElement => {
  const { t } = useTranslation();
  return <>{t("auth.footerCopyright").replace("{year}", String(new Date().getFullYear()))}</>;
};
