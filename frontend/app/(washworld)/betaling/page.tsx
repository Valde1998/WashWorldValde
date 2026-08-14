"use client";

import type { SyntheticEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { apiErrorMessage, getPlans, signup, verificationEmailFromError } from "@/lib/api";
import {
  afterRender,
  EMPTY_SIGNUP,
  clearSignupDraft,
  readSignupDraft,
  saveNotice,
  takeNotice,
  type SignupDraft,
} from "@/lib/browserSession";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { Plan } from "@/types/app";

export default function PaymentPage() {
  const router = useRouter();
  const [browserReady, setBrowserReady] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("Klar");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [signupForm, setSignupForm] = useState<SignupDraft>(EMPTY_SIGNUP);
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  useEffect(() => {
    return afterRender(() => {
      setNotice(takeNotice());
      setSignupForm(readSignupDraft());
      void getPlans().then(setPlans).catch((error) => setNotice(apiErrorMessage(error)));
      setBrowserReady(true);
    });
  }, []);

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

    try {
      const response = await signup({
        email: signupForm.email,
        first_name: signupForm.first_name,
        license_plate: signupForm.license_plate,
        location_id: signupForm.location_id,
        password: signupForm.password,
        phone: signupForm.phone,
        plan_id: signupForm.plan_id,
      });
      clearSignupDraft();
      saveNotice(response.message);
      router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      const verificationEmail = verificationEmailFromError(error);
      if (verificationEmail) {
        saveNotice(apiErrorMessage(error));
        router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(verificationEmail)}`);
        return;
      }

      setNotice(apiErrorMessage(error));
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
