"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type {
  ForgotPasswordPayload,
  Location,
  LoginPayload,
  Plan,
  ResetPasswordPayload,
  SignupPayload,
} from "@/types/app";

export type AuthMode = "login" | "signup" | "forgot" | "reset";

type AuthPanelProps = {
  mode: AuthMode;
  locations: Location[];
  plans: Plan[];
  isLoading: boolean;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (payload: LoginPayload) => void;
  onSignup: (payload: SignupPayload) => void;
  onForgotPassword: (payload: ForgotPasswordPayload) => void;
  onResetPassword: (payload: ResetPasswordPayload) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export default function AuthPanel({
  mode,
  locations,
  plans,
  isLoading,
  onModeChange,
  onLogin,
  onSignup,
  onForgotPassword,
  onResetPassword,
}: AuthPanelProps) {
  const [formError, setFormError] = useState("");
  const [loginForm, setLoginForm] = useState<LoginPayload>({
    email: "",
    password: "",
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
  const [forgotForm, setForgotForm] = useState<ForgotPasswordPayload>({
    email: "",
  });
  const [resetForm, setResetForm] = useState<ResetPasswordPayload>({
    reset_key: "",
    password: "",
  });

  const selectedLocationId = signupForm.location_id || locations[0]?.location_id || 1;
  const selectedPlanId = signupForm.plan_id || plans[1]?.plan_id || plans[0]?.plan_id || 1;
  const hasSignupOptions = locations.length > 0 && plans.length > 0;

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!isEmail(loginForm.email) || loginForm.password.length < 8) {
      setFormError("Udfyld email og kodeord korrekt.");
      return;
    }

    onLogin(loginForm);
  }

  function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (signupForm.first_name.trim().length < 2) {
      setFormError("Navn skal være mindst 2 tegn.");
      return;
    }

    if (!isEmail(signupForm.email)) {
      setFormError("Email skal være gyldig.");
      return;
    }

    if (signupForm.password.length < 8) {
      setFormError("Kodeord skal være mindst 8 tegn.");
      return;
    }

    if (signupForm.license_plate.trim().length < 2) {
      setFormError("Nummerplade skal udfyldes.");
      return;
    }

    if (!hasSignupOptions) {
      setFormError("Lokationer og abonnementer er ikke indlæst endnu.");
      return;
    }

    onSignup({
      ...signupForm,
      location_id: selectedLocationId,
      plan_id: selectedPlanId,
    });
  }

  function submitForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!isEmail(forgotForm.email)) {
      setFormError("Email skal være gyldig.");
      return;
    }

    onForgotPassword(forgotForm);
  }

  function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (resetForm.reset_key.trim().length !== 32) {
      setFormError("Reset-koden skal være 32 tegn.");
      return;
    }

    if (resetForm.password.length < 8) {
      setFormError("Nyt kodeord skal være mindst 8 tegn.");
      return;
    }

    onResetPassword(resetForm);
  }

  const title = {
    login: "Log ind",
    signup: "Opret bruger",
    forgot: "Glemt kodeord",
    reset: "Nulstil kodeord",
  }[mode];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Konto</p>
          <h2>{title}</h2>
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

      {formError ? <p className="form-error">{formError}</p> : null}

      {mode === "login" ? (
        <form className="form-grid" onSubmit={submitLogin}>
          <label>
            Email
            <input
              required
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
              required
              minLength={8}
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
          <button className="ghost-button" type="button" onClick={() => onModeChange("forgot")}>
            Glemt kodeord
          </button>
        </form>
      ) : null}

      {mode === "signup" ? (
        <form className="form-grid" onSubmit={submitSignup}>
          <label>
            Navn
            <input
              required
              minLength={2}
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
              required
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
              required
              minLength={8}
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
              required
              minLength={2}
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
          <button className="primary-button" type="submit" disabled={isLoading || !hasSignupOptions}>
            Opret bruger
          </button>
        </form>
      ) : null}

      {mode === "forgot" ? (
        <form className="form-grid" onSubmit={submitForgotPassword}>
          <label>
            Email
            <input
              required
              type="email"
              value={forgotForm.email}
              onChange={(event) => setForgotForm({ email: event.target.value })}
            />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            Send reset-email
          </button>
          <button className="ghost-button" type="button" onClick={() => onModeChange("login")}>
            Tilbage
          </button>
        </form>
      ) : null}

      {mode === "reset" ? (
        <form className="form-grid" onSubmit={submitResetPassword}>
          <label>
            Reset-kode
            <input
              required
              minLength={32}
              maxLength={32}
              value={resetForm.reset_key}
              onChange={(event) =>
                setResetForm((current) => ({
                  ...current,
                  reset_key: event.target.value,
                }))
              }
            />
          </label>
          <label>
            Nyt kodeord
            <input
              required
              minLength={8}
              type="password"
              value={resetForm.password}
              onChange={(event) =>
                setResetForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <button className="primary-button" type="submit" disabled={isLoading}>
            Gem nyt kodeord
          </button>
          <button className="ghost-button" type="button" onClick={() => onModeChange("login")}>
            Tilbage
          </button>
        </form>
      ) : null}
    </section>
  );
}
