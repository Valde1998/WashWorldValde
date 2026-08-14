"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { apiErrorMessage, resendVerification, verifyEmail } from "@/lib/api";
import { afterRender, saveLogin, takeNotice } from "@/lib/browserSession";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES } from "@/lib/routes";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const automaticVerificationAttempt = useRef("");
  const [browserReady, setBrowserReady] = useState(false);
  const [notice, setNotice] = useState("Klar");

  const verificationEmail = searchParams.get("email") || "";
  const verificationToken = searchParams.get("token") || "";

  const verifyUserEmail = useCallback(async () => {
    if (!verificationEmail || !verificationToken) {
      setNotice("Bekræftelseslinket mangler email eller token.");
      return;
    }

    try {
      const session = await verifyEmail({ email: verificationEmail, token: verificationToken });
      saveLogin(session);
      router.replace(APP_TAB_ROUTES.home);
    } catch (error) {
      setNotice(apiErrorMessage(error));
    }
  }, [router, verificationEmail, verificationToken]);

  async function resendUserVerification() {
    if (!verificationEmail) {
      setNotice("Email mangler, så vi kan ikke sende et nyt link.");
      return;
    }

    try {
      const response = await resendVerification(verificationEmail);
      setNotice(response.message);
    } catch (error) {
      setNotice(apiErrorMessage(error));
    }
  }

  useEffect(() => {
    return afterRender(() => {
      setNotice(takeNotice());
      setBrowserReady(true);
    });
  }, []);

  useEffect(() => {
    if (!browserReady || !verificationEmail || !verificationToken) return;

    const attempt = `${verificationEmail}:${verificationToken}`;
    if (automaticVerificationAttempt.current === attempt) return;

    automaticVerificationAttempt.current = attempt;
    void verifyUserEmail();
  }, [browserReady, verificationEmail, verificationToken, verifyUserEmail]);

  if (!browserReady) return <LoadingPage text="Åbner emailbekræftelse..." />;

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => router.push(AUTH_SCREEN_ROUTES.login)} />
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
            type="button"
            onClick={verifyUserEmail}
          >
            Prøv bekræftelse igen
          </button>
        ) : null}
        <button
          className="text-button"
          type="button"
          onClick={resendUserVerification}
        >
          Send et nyt link
        </button>
        <button className="text-button muted-text-button" type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.signup)}>
          Brug en anden email
        </button>
      </section>
    </main>
  );
}
