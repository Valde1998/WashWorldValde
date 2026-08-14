"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { afterRender, takeNotice } from "@/lib/browserSession";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";

export default function EmailSentPage() {
  const router = useRouter();
  const [browserReady, setBrowserReady] = useState(false);
  const [notice, setNotice] = useState("Klar");

  useEffect(() => {
    return afterRender(() => {
      setNotice(takeNotice());
      setBrowserReady(true);
    });
  }, []);

  if (!browserReady) return <LoadingPage text="Åbner siden..." />;

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader />
      <section className="auth-content centered-content">
        <div className="success-icon">✓</div>
        <h1>Email er sendt</h1>
        <p className="screen-intro">Hvis emailen findes, har vi sendt en reset-kode til din indbakke.</p>
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
        <button className="primary-button" type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.reset)}>
          Jeg har en reset-kode
        </button>
        <button className="text-button" type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.login)}>
          Gå tilbage til login
        </button>
      </section>
    </main>
  );
}
