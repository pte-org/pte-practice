"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { COMMON_TEXT } from "@/features/common/constants";
import { AppIcon, ProductMark } from "@/features/icons/AppIcon";
import { NAV_ITEMS, PRACTICE_ROUTES } from "@/features/practice/constants";
import { usePractice } from "@/features/practice/PracticeProvider";

export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus, signOut } = usePractice();
  const activeNavItem = NAV_ITEMS.find((item) => item.href === PRACTICE_ROUTES.home
    ? pathname === item.href
    : pathname.startsWith(item.href));

  useEffect(() => {
    if (authStatus === "signed-out") router.replace(PRACTICE_ROUTES.signIn);
  }, [authStatus, router]);

  if (authStatus === "loading") return <ShellLoading />;

  if (authStatus === "signed-out") {
    return <ShellLoading />;
  }

  return (
    <div className="student-shell">
      <aside className="side-rail" aria-label="Student navigation">
        <div className="rail-brand">
          <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
          <div>
            <strong>Pearson</strong>
            <span>PTE Official AI Practice</span>
          </div>
        </div>
        <Link className="quick-study-button" href={PRACTICE_ROUTES.home}>
          <AppIcon name="bookOpen" size={22} />
          <span>Quick study</span>
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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="rail-spacer" />
        <div className="account-card">
          <div className="account-avatar" aria-hidden="true">S</div>
          <div className="account-copy">
            <strong>Student</strong>
            <span>Account</span>
          </div>
          <button className="icon-button" type="button" onClick={signOut} aria-label={COMMON_TEXT.signOut} title={COMMON_TEXT.signOut}>
            <AppIcon name="signOut" size={18} />
          </button>
        </div>
        <p className="rail-footer">Practice workspace</p>
      </aside>

      <div className="workspace">
        <header className="top-bar">
          <div className="mobile-brand">
            <div className="brand-mark brand-mark-small" aria-hidden="true"><ProductMark /></div>
            <strong>PTE Official AI Practice</strong>
          </div>
          <span className="top-page-title">{activeNavItem?.label ?? "Home"}</span>
          <div className="top-bar-spacer" />
          <div className="search-pill" aria-label="Search is not available in this release">
            <AppIcon name="search" size={20} />
            <span>Search</span>
            <kbd>⌘ K</kbd>
          </div>
          <div className="top-context" aria-label="Current practice product">
            <span>Pearson PTE Core</span>
            <AppIcon name="chevronDown" size={17} />
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}

function ShellLoading() {
  return (
    <main className="shell-loading" role="status" aria-live="polite">
      <div className="loading-panel">
        <div className="brand-mark" aria-hidden="true"><ProductMark /></div>
        <span className="loading-dot" aria-hidden="true" />
        Loading your practice workspace…
      </div>
    </main>
  );
}
