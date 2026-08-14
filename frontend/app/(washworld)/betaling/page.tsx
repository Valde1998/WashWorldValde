"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";

export default function PaymentPage() {
  const { browserReady, createAccount, goTo, notice, plans, signupForm } = useWashWorld({
    loadPlans: true,
  });
  const [formError, setFormError] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  if (!browserReady) return <LoadingPage text="Åbner betaling..." />;

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
    await createAccount({
      email: signupForm.email,
      first_name: signupForm.first_name,
      license_plate: signupForm.license_plate,
      location_id: signupForm.location_id,
      password: signupForm.password,
      phone: signupForm.phone,
      plan_id: signupForm.plan_id,
    });
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("plans")} />
      <section className="auth-content">
        <p className="step-label">Trin 3 af 3</p>
        <h1>Opdater dit betalingskort</h1>
        <p className="screen-intro">Kortoplysningerne bliver ikke gemt.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
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
          <button className="primary-button" type="submit">Start medlemskab</button>
        </form>
      </section>
    </main>
  );
}
