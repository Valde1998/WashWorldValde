"use client";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useEmailVerification } from "@/hooks/useEmailVerification";

export default function VerifyEmailPage() {
  const {
    authLoading,
    goTo,
    isHydrated,
    notice,
    resendUserVerification,
    verificationEmail,
    verificationToken,
    verifyUserEmail,
  } = useEmailVerification();

  if (!isHydrated) return <LoadingPage text="Åbner emailbekræftelse..." />;

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("login")} />
      <section className="auth-content centered-content">
        <div className="success-icon email-icon">@</div>
        <p className="step-label">Sidste trin</p>
        <h1>Bekræft din email</h1>
        <p className="screen-intro">
          {verificationToken ? (
            <>Din email <strong>{verificationEmail}</strong> bekræftes nu automatisk.</>
          ) : (
            <>Vi har sendt et bekræftelseslink til <strong>{verificationEmail}</strong>. Åbn linket i emailen for at fortsætte.</>
          )}
        </p>
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
        {verificationToken ? (
          <button
            className="primary-button verification-form"
            disabled={authLoading}
            type="button"
            onClick={verifyUserEmail}
          >
            {authLoading ? "Bekræfter..." : "Prøv bekræftelse igen"}
          </button>
        ) : null}
        <button
          className="text-button"
          disabled={authLoading}
          type="button"
          onClick={resendUserVerification}
        >
          Send et nyt link
        </button>
        <button className="text-button muted-text-button" type="button" onClick={() => goTo("signup")}>
          Brug en anden email
        </button>
      </section>
    </main>
  );
}
