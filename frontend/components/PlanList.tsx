"use client";

import type { Plan } from "@/types/app";

type PlanListProps = {
  plans: Plan[];
  currentPlanId?: number;
};

export default function PlanList({ plans, currentPlanId }: PlanListProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Abonnement</p>
          <h2>Pakker</h2>
        </div>
      </div>

      <div className="plan-list">
        {plans.map((plan) => (
          <article className={plan.plan_id === currentPlanId ? "plan-card active" : "plan-card"} key={plan.plan_id}>
            <div>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
            </div>
            <div className="price-row">
              <strong>{plan.monthly_price} kr.</strong>
              <span>pr. md.</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
