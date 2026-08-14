"use client";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";

export default function MembershipPage() {
  const { browserReady, goTo, plans, signupForm, updateSignup } = useWashWorld({ loadPlans: true });

  if (!browserReady) return <LoadingPage text="Henter medlemskaber..." />;

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("signup")} />
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
          onClick={() => goTo("payment")}
        >
          Fortsæt til betaling
        </button>
      </section>
    </main>
  );
}
