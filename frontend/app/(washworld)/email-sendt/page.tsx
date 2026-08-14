"use client";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";

export default function EmailSentPage() {
  const { browserReady, goTo, notice } = useWashWorld();

  if (!browserReady) return <LoadingPage text="Åbner siden..." />;

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader />
      <section className="auth-content centered-content">
        <div className="success-icon">✓</div>
        <h1>Email er sendt</h1>
        <p className="screen-intro">Hvis emailen findes, har vi sendt en reset-kode til din indbakke.</p>
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
        <button className="primary-button" type="button" onClick={() => goTo("reset")}>
          Jeg har en reset-kode
        </button>
        <button className="text-button" type="button" onClick={() => goTo("login")}>
          Gå tilbage til login
        </button>
      </section>
    </main>
  );
}
