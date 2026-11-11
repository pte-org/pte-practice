"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppIcon, ErrorPage, LoadingState, ProductMark } from "@/common/components";
import { signInHref } from "@/features/auth/return-path";
import { SessionSkeleton } from "@/features/practice/session/SessionSkeleton";
import { NAV_ITEMS, PRACTICE_ROUTES } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";
import { PracticeAccessNotice } from "@/features/practice/PracticeAccessNotice";
import { PracticeWorkspaceBoundary } from "@/features/workspace/PracticeWorkspace";
import { usePracticeAccessToast } from "@/features/practice/useAccessToast";
import { readReadingSize, type DeviceCheckKind } from "@/features/deviceCheck/device-check";
import { DeviceCheckDialog } from "@/features/deviceCheck/DeviceCheckDialog";
import { useDeviceChecks } from "@/features/deviceCheck/useDeviceChecks";
import { usePracticeStart } from "@/features/practice/mode/usePracticeStart";
import { CommandPalette } from "./CommandPalette";
import { NavIcon, type NavIconName } from "./NavIcon";
import { StudentSettings } from "@/features/settings/StudentSettings";
import { useTranslation } from "@/common/i18n";
import type { TranslationKey } from "@/common/i18n";
import { PracticeBackground } from "@/features/practice/appearance/PracticeBackground";
import { usePracticeAppearance } from "@/features/practice/appearance/usePracticeAppearance";
import { isStudioRoute, isWorkspaceRoute } from "@/features/workspace/constants";
import { PipCompanion } from "@/features/mascot/PipCompanion";
import { ChatLayout } from "@/features/chat/ChatLayout";
import "./shell-chrome.css";

export function StudentShell({ children }: { children: ReactNode }) {
  usePracticeAccessToast();
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, signOut } = usePractice();
  const { t } = useTranslation();
  const appearance = usePracticeAppearance();
  const workspaceRoute = isWorkspaceRoute(pathname);
  const studioRoute = isStudioRoute(pathname);
  const workspaceBackground = studioRoute && !appearance.focus ? appearance.background : "default";
  const { markPassed, markFailed } = useDeviceChecks();
  const { openFor, dialog: practiceModeDialog } = usePracticeStart();

  const [searchOpen, setSearchOpen] = useState(false);
  // Set by the sign-out button: that student goes straight to sign-in instead of seeing the 401 page.
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = () => {
    setSigningOut(true);
    signOut();
  };
  const [deviceCheckKind, setDeviceCheckKind] = useState<DeviceCheckKind | null>(null);


  // Global shortcut: ⌘K / Ctrl+K toggles the command palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  
  const activeNavItem = NAV_ITEMS.find((item) => item.href === PRACTICE_ROUTES.home
    ? pathname === item.href
    : pathname.startsWith(item.href));

  useEffect(() => {
    if (authStatus === "signed-out" && signingOut) router.replace(PRACTICE_ROUTES.signIn);
  }, [authStatus, router, signingOut]);

  // The text size the student picked in the reading check applies to every practice page.
  useEffect(() => {
    document.documentElement.dataset.readingSize = readReadingSize();
  }, []);

  if (authStatus === "loading") return pathname === PRACTICE_ROUTES.practiceSession
    ? <SessionSkeleton /> : <LoadingState message={t("common.loadingWorkspace")} />;

  if (authStatus === "signed-out") {
    return signingOut ? <LoadingState message={t("common.loadingWorkspace")} />
      : <ErrorPage kind="unauthorized" fullScreen action={{ href: signInHref(pathname), label: t("errorPage.signIn") }} />;
  }

  // The practice session is its own page, like the Pearson practice session: no rail or top bar to wander off to.
  if (pathname === PRACTICE_ROUTES.practiceSession) {
    return <main className="session-page"><PracticeAccessNotice />{children}</main>;
  }

  return (
    <ChatLayout taskCode={null}>
    <div className={`student-shell${studioRoute ? " studio-shell" : ""}`} data-background={workspaceBackground}
      data-background-blur={appearance.blur} data-glass-opacity={appearance.opacity}>
      {workspaceBackground !== "default" ? <PracticeBackground value={appearance} /> : null}
      <aside className="side-rail" aria-label="Student navigation">
        <div className="rail-brand">
          <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
          <div>
            <strong>{t("shell.pearson")}</strong>
            <span>{t("shell.pteOfficialAIPractice")}</span>
          </div>
        </div>
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === PRACTICE_ROUTES.home
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-link${isActive ? " nav-link-active" : ""}`}
                href={item.href}
                prefetch={true}
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true"><NavIcon name={item.icon as NavIconName} /></span>
                <span>{t(`nav.${item.icon === "practice" ? "practiceTests" : item.icon}` as TranslationKey)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="rail-spacer" />
        {workspaceRoute ? <PipCompanion /> : null}
        <div className="account-card">
          <div className="account-avatar" aria-hidden="true">S</div>
          <div className="account-copy">
            <strong>{t("shell.student")}</strong>
            <span>{t("shell.account")}</span>
          </div>
          <StudentSettings />
          <button className="icon-button" type="button" onClick={handleSignOut} aria-label={t("common.signOut")} title={t("common.signOut")}>
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
          <button
            type="button"
            className="search-pill"
            onClick={() => setSearchOpen(true)}
            aria-label={t("commandPalette.placeholder")}
          >
            <AppIcon name="search" size={20} />
            <span>{t("shell.search")}</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="student-settings-mobile"><StudentSettings /></div>
        </header>
        <main className="main-content"><PracticeAccessNotice /><PracticeWorkspaceBoundary>{children}</PracticeWorkspaceBoundary></main>
      </div>

      {searchOpen ? (
        <CommandPalette
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onStartTask={openFor}
          onOpenDeviceCheck={(kind) => setDeviceCheckKind(kind)}
        />
      ) : null}
      <DeviceCheckDialog
        kind={deviceCheckKind}
        onClose={() => setDeviceCheckKind(null)}
        onPassed={markPassed}
        onFailed={markFailed}
      />
      {practiceModeDialog}
    </div>
    </ChatLayout>
  );
}
