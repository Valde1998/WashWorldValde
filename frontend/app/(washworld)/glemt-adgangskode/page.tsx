"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";
import { isValidEmail } from "@/lib/formValidation";

export default function ForgotPasswordPage() {
  const { authLoading, goTo, isHydrated, notice, requestPasswordReset } = useWashWorld();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  if (!isHydrated) return <LoadingPage text="Åbner siden..." />;

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!isValidEmail(email)) {
      setFormError("Indtast en gyldig emailadresse.");
      return;
    }
    requestPasswordReset({ email: email.trim().toLowerCase() });
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("login")} />
      <section className="auth-content">
        <h1>Glemt adgangskode</h1>
        <p className="screen-intro">Indtast din email, så sender vi en reset-kode.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
        <form className="mobile-form" noValidate onSubmit={submit}>
          <label>
            Email
            <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button className="primary-button" disabled={authLoading} type="submit">Send email</button>
        </form>
      </section>
    </main>
  );
}
