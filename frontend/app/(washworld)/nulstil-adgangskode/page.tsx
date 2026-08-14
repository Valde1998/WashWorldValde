"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";
import type { ResetPasswordPayload } from "@/types/app";

export default function ResetPasswordPage() {
  const { goTo, isHydrated, notice, saveNewPassword } = useWashWorld();
  const [form, setForm] = useState<ResetPasswordPayload>({ reset_key: "", password: "" });
  const [formError, setFormError] = useState("");

  if (!isHydrated) return <LoadingPage text="Åbner nulstilling..." />;

  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (form.reset_key.trim().length !== 32) {
      setFormError("Reset-koden skal bestå af 32 tegn.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Det nye kodeord skal være mindst 8 tegn.");
      return;
    }
    saveNewPassword({ ...form, reset_key: form.reset_key.trim() });
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("login")} />
      <section className="auth-content">
        <h1>Nulstil kodeord</h1>
        <p className="screen-intro">Indtast koden fra emailen og vælg et nyt kodeord.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
        <form className="mobile-form" noValidate onSubmit={submit}>
          <label>
            Reset-kode
            <input
              maxLength={32}
              minLength={32}
              value={form.reset_key}
              onChange={(event) => setForm({ ...form, reset_key: event.target.value })}
            />
          </label>
          <label>
            Nyt kodeord
            <input
              autoComplete="new-password"
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <button className="primary-button" type="submit">Gem nyt kodeord</button>
        </form>
      </section>
    </main>
  );
}
