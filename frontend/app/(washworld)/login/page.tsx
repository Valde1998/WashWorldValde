"use client";

import type { SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { apiErrorMessage, login, verificationEmailFromError } from "@/lib/api";
import { afterRender, readToken, saveLogin } from "@/lib/browserSession";
import { isValidEmail } from "@/lib/formValidation";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { LoginPayload } from "@/types/app";

export default function LoginPage() {
  const router = useRouter();
  const [browserReady, setBrowserReady] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });

  useEffect(() => {
    return afterRender(() => {
      if (readToken()) router.replace(APP_TAB_ROUTES.home);
      setBrowserReady(true);
    });
  }, [router]);

  if (!browserReady) return <LoadingPage text="Åbner login..." />;

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
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

    try {
      const session = await login({ email: form.email.trim().toLowerCase(), password: form.password });
      saveLogin(session);
      router.replace(APP_TAB_ROUTES.home);
    } catch (error) {
      const verificationEmail = verificationEmailFromError(error);
      if (verificationEmail) {
        router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(verificationEmail)}`);
        return;
      }

      setFormError(apiErrorMessage(error));
    }
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => router.push(AUTH_SCREEN_ROUTES.welcome)} />
      <section className="auth-content">
        <h1>Log ind</h1>
        <p className="screen-intro">Log ind for at se dit medlemskab og dine seneste vaske.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
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
          <button className="primary-button" type="submit">Log ind</button>
          <button className="text-button" type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.forgot)}>
            Glemt adgangskode?
          </button>
          <p className="auth-switch">
            Har du ikke en bruger?{" "}
            <button type="button" onClick={() => router.push(AUTH_SCREEN_ROUTES.signup)}>Bliv medlem</button>
          </p>
        </form>
      </section>
    </main>
  );
}
