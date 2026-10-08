"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { COMMON_TEXT } from "@/common/constants";
import { AppIcon, ProductMark } from "@/common/components";
import { NAV_ITEMS, PRACTICE_ROUTES } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";
import { useTheme } from "@/common/providers/ThemeProvider";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, signOut } = usePractice();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useTranslation();
  
  const toggleLocale = () => setLocale(locale === "en" ? "vi" : "en");
  
  const activeNavItem = NAV_ITEMS.find((item) => item.href === PRACTICE_ROUTES.home
    ? pathname === item.href
    : pathname.startsWith(item.href));

  useEffect(() => {
    if (authStatus === "signed-out") router.replace(PRACTICE_ROUTES.signIn);
  }, [authStatus, router]);

  if (authStatus === "loading") return <ShellLoading t={t} />;

  if (authStatus === "signed-out") {
    return <ShellLoading t={t} />;
  }

  return (
    <div className="student-shell">
      <aside className="side-rail" aria-label="Student navigation">
        <div className="rail-brand">
          <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
          <div>
            <strong>{t("shell.pearson")}</strong>
            <span>{t("shell.pteOfficialAIPractice")}</span>
          </div>
        </div>
        <Link className="quick-study-button" href={PRACTICE_ROUTES.home}>
          <AppIcon name="bookOpen" size={22} />
          <span>{t("shell.quickStudy")}</span>
        </Link>
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === PRACTICE_ROUTES.home
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-link${isActive ? " nav-link-active" : ""}`}
                href={item.href}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true"><AppIcon name={item.icon} size={21} /></span>
                <span>{t(`nav.${item.icon === "practice" ? "practiceTests" : item.icon}` as TranslationKey)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="rail-spacer" />
        <div className="account-card">
          <div className="account-avatar" aria-hidden="true">S</div>
          <div className="account-copy">
            <strong>{t("shell.student")}</strong>
            <span>{t("shell.account")}</span>
          </div>
          <button className="icon-button" type="button" onClick={toggleLocale} aria-label="Toggle language" title="Toggle language">
            {locale.toUpperCase()}
          </button>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            <AppIcon name={theme === "dark" ? "sun" : "moon"} size={18} />
          </button>
          <button className="icon-button" type="button" onClick={signOut} aria-label={t("common.signOut")} title={t("common.signOut")}>
            <AppIcon name="signOut" size={18} />
          </button>
        </div>
        <p className="rail-footer">{t("shell.practiceWorkspace")}</p>
      </aside>

      <div className="workspace">
        <header className="top-bar">
          <div className="mobile-brand">
            <div className="brand-mark brand-mark-small" aria-hidden="true"><ProductMark /></div>
            <strong>{t("shell.pteOfficialAIPractice")}</strong>
          </div>
          <span className="top-page-title">{activeNavItem ? t(`nav.${activeNavItem.icon === "practice" ? "practiceTests" : activeNavItem.icon}` as TranslationKey) : t("nav.home")}</span>
          <div className="top-bar-spacer" />
          <div className="search-pill" aria-label="Search is not available in this release">
            <AppIcon name="search" size={20} />
            <span>{t("shell.search")}</span>
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-context" aria-label="Current practice product">
            <span>{t("shell.pearsonPTECore")}</span>
            <AppIcon name="chevronDown" size={17} />
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

function ShellLoading({ t }: { t?: (k: TranslationKey) => string }) {
  return (
    <main className="shell-loading" role="status" aria-live="polite">
      <div className="loading-panel">
        <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
        <span className="loading-dot" aria-hidden="true" />
        {t ? t("common.loadingWorkspace") : "Loading your practice workspace…"}
      </div>
    </main>
  );
}
