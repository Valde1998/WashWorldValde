"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";
import { isValidEmail } from "@/lib/formValidation";
import type { LoginPayload } from "@/types/app";

export default function LoginPage() {
  const { authLoading, goTo, isHydrated, loginUser, notice } = useWashWorld({ redirectIfLoggedIn: true });
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });

  if (!isHydrated) return <LoadingPage text="Åbner login..." />;

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!isValidEmail(form.email)) {
      setFormError("Indtast en gyldig emailadresse.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Kodeordet skal være mindst 8 tegn.");
      return;
    }
    loginUser({ email: form.email.trim().toLowerCase(), password: form.password });
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("welcome")} />
      <section className="auth-content">
        <h1>Log ind</h1>
        <p className="screen-intro">Log ind for at se dit medlemskab og dine seneste vaske.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
        <form className="mobile-form" noValidate onSubmit={submit}>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Kodeord
            <input
              autoComplete="current-password"
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <button className="primary-button" disabled={authLoading} type="submit">
            {authLoading ? "Logger ind..." : "Log ind"}
          </button>
          <button className="text-button" type="button" onClick={() => goTo("forgot")}>
            Glemt adgangskode?
          </button>
          <p className="auth-switch">
            Har du ikke en bruger?{" "}
            <button type="button" onClick={() => goTo("signup")}>Bliv medlem</button>
          </p>
        </form>
      </section>
    </main>
  );
}
