"use client";

import type { SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { apiErrorMessage, forgotPassword } from "@/lib/api";
import { afterRender } from "@/lib/browserSession";
import { isValidEmail } from "@/lib/formValidation";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [browserReady, setBrowserReady] = useState(false);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    return afterRender(() => {
      setBrowserReady(true);
    });
  }, []);

  if (!browserReady) return <LoadingPage text="Åbner siden..." />;

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!isValidEmail(email)) {
      setFormError("Indtast en gyldig emailadresse.");
      return;
    }

    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      router.push(AUTH_SCREEN_ROUTES.sent);
    } catch (error) {
      setFormError(apiErrorMessage(error));
    }
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => router.push(AUTH_SCREEN_ROUTES.login)} />
      <section className="auth-content">
        <h1>Glemt adgangskode</h1>
        <p className="screen-intro">Indtast din email, så sender vi en reset-kode.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        <form className="mobile-form" noValidate onSubmit={submit}>
          <label>
            Email
            <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button className="primary-button" type="submit">Send email</button>
        </form>
      </section>
    </main>
  );
}
