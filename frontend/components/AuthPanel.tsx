"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { Location, LoginPayload, Plan, SignupPayload } from "@/types/app";

type AuthMode = "login" | "signup";

type AuthPanelProps = {
  mode: AuthMode;
  locations: Location[];
  plans: Plan[];
  isLoading: boolean;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (payload: LoginPayload) => void;
  onSignup: (payload: SignupPayload) => void;
};

export default function AuthPanel({
  mode,
  locations,
  plans,
  isLoading,
  onModeChange,
  onLogin,
  onSignup,
}: AuthPanelProps) {
  const [loginForm, setLoginForm] = useState<LoginPayload>({
    email: "demo@cleanwash.dk",
    password: "kodeord123",
  });
  const [signupForm, setSignupForm] = useState<SignupPayload>({
    first_name: "",
    email: "",
    password: "",
    license_plate: "",
    phone: "",
    location_id: 0,
    plan_id: 0,
  });
  const selectedLocationId = signupForm.location_id || locations[0]?.location_id || 1;
  const selectedPlanId = signupForm.plan_id || plans[1]?.plan_id || plans[0]?.plan_id || 1;

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(loginForm);
  }

  function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSignup({
      ...signupForm,
      location_id: selectedLocationId,
      plan_id: selectedPlanId,
    });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Konto</p>
          <h2>{mode === "login" ? "Log ind" : "Opret bruger"}</h2>
        </div>
        <div className="segmented-control" aria-label="Skift kontoform">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => onModeChange("login")}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "active" : ""}
            type="button"
            onClick={() => onModeChange("signup")}
          >
            Opret
          </button>
        </div>
      </div>

      {mode === "login" ? (
        <form className="form-grid" onSubmit={submitLogin}>
          <label>
            Email
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Kodeord
            <input
              type="password"
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            Log ind
          </button>
        </form>
      ) : (
        <form className="form-grid" onSubmit={submitSignup}>
          <label>
            Navn
            <input
              value={signupForm.first_name}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  first_name: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={signupForm.email}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Kodeord
            <input
              type="password"
              value={signupForm.password}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Nummerplade
            <input
              value={signupForm.license_plate}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  license_plate: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Telefon
            <input
              value={signupForm.phone}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Fast vaskehal
            <select
              value={selectedLocationId}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  location_id: Number(event.target.value),
                }))
              }
            >
              {locations.map((location) => (
                <option key={location.location_id} value={location.location_id}>
                  {location.city}
                </option>
              ))}
            </select>
          </label>
          <label>
            Abonnement
            <select
              value={selectedPlanId}
              onChange={(event) =>
                setSignupForm((current) => ({
                  ...current,
                  plan_id: Number(event.target.value),
                }))
              }
            >
              {plans.map((plan) => (
                <option key={plan.plan_id} value={plan.plan_id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            Opret bruger
          </button>
        </form>
      )}
    </section>
  );
}
