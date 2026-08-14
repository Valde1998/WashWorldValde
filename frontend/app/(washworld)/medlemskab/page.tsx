"use client";

import { useRouter } from "next/navigation";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { usePlans } from "@/hooks/usePlans";
import { useSignupDraft } from "@/hooks/useSignupDraft";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";

export default function MembershipPage() {
  const router = useRouter();
  const { isHydrated, signupForm, updateSignup } = useSignupDraft();
  const { isLoading, plans } = usePlans();

  if (!isHydrated || isLoading) return <LoadingPage text="Henter medlemskaber..." />;

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
