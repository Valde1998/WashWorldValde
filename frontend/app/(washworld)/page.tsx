"use client";

import Image from "next/image";

import { LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";

export default function WelcomePage() {
  const { goTo, isHydrated } = useWashWorld({ redirectIfLoggedIn: true });

  if (!isHydrated) return <LoadingPage text="Åbner WashWorld..." />;

  return (
    <main className="mobile-frame welcome-screen">
      <Image
        alt="WashWorld vaskehal"
        className="welcome-image"
        fill
        priority
        sizes="430px"
        src="/location-tilst.webp"
      />
      <div className="welcome-overlay" />
      <div className="welcome-content">
        <Image alt="WashWorld" height={58} src="/logo.webp" width={186} priority />
        <div className="welcome-copy">
          <h1>Ren bil. Nemt medlemskab.</h1>
          <p>Find nærmeste vaskehal, vis din QR-kode og hold styr på alle dine vaske.</p>
        </div>
        <div className="welcome-actions">
          <button className="primary-button" type="button" onClick={() => goTo("login")}>
            Log ind
          </button>
          <button className="dark-button" type="button" onClick={() => goTo("signup")}>
            Bliv medlem
          </button>
        </div>
      </div>
    </main>
  );
}
