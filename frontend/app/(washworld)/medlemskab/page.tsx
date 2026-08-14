"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { getPlans } from "@/lib/api";
import { afterRender, EMPTY_SIGNUP, readSignupDraft, saveSignupDraft, type SignupDraft } from "@/lib/browserSession";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { Plan } from "@/types/app";

export default function MembershipPage() {
  const router = useRouter();
  const [browserReady, setBrowserReady] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [signupForm, setSignupForm] = useState<SignupDraft>(EMPTY_SIGNUP);

  useEffect(() => {
    return afterRender(() => {
      setSignupForm(readSignupDraft());
      void getPlans().then(setPlans);
      setBrowserReady(true);
    });
  }, []);

  function updateSignup(changes: Partial<SignupDraft>) {
    setSignupForm((current) => {
      const updated = { ...current, ...changes };
      saveSignupDraft(updated);
      return updated;
    });
  }

  if (!browserReady) return <LoadingPage text="Henter medlemskaber..." />;

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => router.push(AUTH_SCREEN_ROUTES.signup)} />
      <section className="auth-content wide-auth-content">
        <p className="step-label">Trin 2 af 3</p>
        <h1>Vask som passer til dig</h1>
        <p className="screen-intro">
          Vælg det abonnement, der matcher dit behov. Du kan altid skifte senere.
        </p>
        <div className="mobile-plan-list">
          {plans.map((plan, index) => (
            <button
              className={`mobile-plan-card ${signupForm.plan_id === plan.plan_id ? "selected" : ""}`}
              key={plan.plan_id}
              type="button"
              onClick={() => updateSignup({ plan_id: plan.plan_id })}
            >
              {index === 1 ? <span className="popular-badge">Mest populær</span> : null}
              <span>
                <strong>{plan.name}</strong>
                <small>{plan.description}</small>
              </span>
              <span className="plan-price">
                <strong>{plan.monthly_price}</strong>
                <small>kr./md.</small>
              </span>
            </button>
          ))}
        </div>
        <button
          className="primary-button sticky-action"
          disabled={!signupForm.plan_id}
          type="button"
          onClick={() => router.push(AUTH_SCREEN_ROUTES.payment)}
        >
          Fortsæt til betaling
        </button>
      </section>
    </main>
  );
}
