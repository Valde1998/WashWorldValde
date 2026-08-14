"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingPage } from "@/components/PageLayout";
import { afterRender, readToken } from "@/lib/browserSession";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES } from "@/lib/routes";

export default function WelcomePage() {
  const router = useRouter();
  const [browserReady, setBrowserReady] = useState(false);

  useEffect(() => {
    return afterRender(() => {
      if (readToken()) router.replace(APP_TAB_ROUTES.home);
      setBrowserReady(true);
    });
  }, [router]);

  if (!browserReady) return <LoadingPage text="Åbner WashWorld..." />;

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
          <button className="primary-button" type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.login)}>
            Log ind
          </button>
          <button className="dark-button" type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.signup)}>
            Bliv medlem
          </button>
        </div>
      </div>
    </main>
  );
}
