"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { ApiError, signup } from "@/lib/api";
import { saveStoredNotice } from "@/lib/browserStorage";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";
import { usePlans } from "@/hooks/usePlans";
import { useSignupDraft } from "@/hooks/useSignupDraft";

export default function PaymentPage() {
  const router = useRouter();
  const { clearSignup, isHydrated, signupForm } = useSignupDraft();
  const { plans } = usePlans();
  const [formError, setFormError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  if (!isHydrated) return <LoadingPage text="Åbner betaling..." />;

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (card.replace(/\D/g, "").length !== 16) {
      setFormError("Kortnummeret skal bestå af 16 cifre.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setFormError("Udløbsdato skal skrives som MM/ÅÅ.");
      return;
    }
    if (!/^\d{3}$/.test(cvc)) {
      setFormError("CVC skal bestå af 3 cifre.");
      return;
    }
    const { confirm_email: _confirmEmail, ...payload } = signupForm;

    setAuthLoading(true);
    try {
      const response = await signup(payload);
      clearSignup();
      saveStoredNotice(response.message);
      router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      if (
        error instanceof ApiError &&
        typeof error.data === "object" &&
        error.data !== null &&
        "verification_required" in error.data &&
        "email" in error.data &&
        error.data.verification_required === true &&
        typeof error.data.email === "string"
      ) {
        saveStoredNotice(error.message);
        router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(error.data.email)}`);
      } else {
        setFormError(error instanceof Error ? error.message : "Kontoen kunne ikke oprettes.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => router.push(AUTH_SCREEN_ROUTES.plans)} />
      <section className="auth-content">
        <p className="step-label">Trin 3 af 3</p>
        <h1>Opdater dit betalingskort</h1>
        <p className="screen-intro">Kortoplysningerne bliver ikke gemt.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        <form className="mobile-form" noValidate onSubmit={submit}>
          <label>
            Kortnummer
            <input
              autoComplete="cc-number"
              inputMode="numeric"
              maxLength={19}
              placeholder="1234 5678 9012 3456"
              value={card}
              onChange={(event) => setCard(event.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              Udløbsdato
              <input
                autoComplete="cc-exp"
                inputMode="numeric"
                maxLength={5}
                placeholder="MM/ÅÅ"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
              />
            </label>
            <label>
              CVC
              <input
                autoComplete="cc-csc"
                inputMode="numeric"
                maxLength={3}
                placeholder="123"
                value={cvc}
                onChange={(event) => setCvc(event.target.value)}
              />
            </label>
          </div>
          <div className="payment-summary">
            <span>Valgt abonnement</span>
            <strong>{plans.find((plan) => plan.plan_id === signupForm.plan_id)?.name ?? "WashWorld"}</strong>
          </div>
          <button className="primary-button" disabled={authLoading} type="submit">
            {authLoading ? "Opretter medlemskab..." : "Start medlemskab"}
          </button>
        </form>
      </section>
    </main>
  );
}
