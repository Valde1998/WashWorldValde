"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { APP_TAB_ROUTES } from "@/lib/routes";
import { useWashWorld } from "@/components/WashWorldProvider";

export function LoadingPage({ text = "Henter dit medlemskab..." }: { text?: string }) {
  return (
    <main className="mobile-frame app-loading-screen">
      <div className="loading-mark">W</div>
      <p>{text}</p>
    </main>
  );
}

export function AuthHeader({ back }: { back?: () => void }) {
  return (
    <header className="auth-header">
      {back ? (
        <button className="icon-button auth-back" type="button" onClick={back} aria-label="Gå tilbage">
          ←
        </button>
      ) : null}
      <Image alt="WashWorld" height={42} src="/logo.webp" width={136} priority />
    </header>
  );
}

const navigation = [
  { href: APP_TAB_ROUTES.home, icon: "⌂", label: "Hjem" },
  { href: APP_TAB_ROUTES.activity, icon: "▥", label: "Aktivitet" },
  { href: APP_TAB_ROUTES.qr, icon: "◇", label: "QR" },
  { href: APP_TAB_ROUTES.locations, icon: "⌕", label: "Vaskehaller" },
  { href: APP_TAB_ROUTES.profile, icon: "○", label: "Profil" },
];

export function MemberPage({ title, children }: { title: string; children?: ReactNode }) {
  const pathname = usePathname();
  const { memberLoading, notice, user } = useWashWorld();

  if (memberLoading || !user) return <LoadingPage />;

  return (
    <main className="mobile-frame signed-in-app">
      <header className="app-header">
        <Image alt="WashWorld" height={38} src="/logo.webp" width={124} priority />
        <span>{title}</span>
      </header>
      {notice !== "Klar" ? <div className="app-notice" role="status">{notice}</div> : null}
      <div className="app-scroll-area">{children}</div>
      <nav className="bottom-navigation" aria-label="App-navigation">
        {navigation.map((item) => {
          const active = item.href === APP_TAB_ROUTES.locations
            ? pathname.startsWith(item.href)
            : pathname === item.href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={active ? "active" : ""}
              href={item.href}
              key={item.href}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
