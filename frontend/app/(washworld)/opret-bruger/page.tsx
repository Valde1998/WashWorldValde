"use client";

import type { SyntheticEvent } from "react";
import { useState } from "react";

import { AuthHeader, LoadingPage } from "@/components/PageLayout";
import { useWashWorld } from "@/hooks/useWashWorld";
import { isValidEmail } from "@/lib/formValidation";

export default function SignupPage() {
  const {
    browserReady,
    goTo,
    locations,
    plans,
    signupForm,
    updateSignup,
    validateSignupDetails,
  } = useWashWorld({ loadLocations: true, loadPlans: true });
  const [formError, setFormError] = useState("");

  if (!browserReady) return <LoadingPage text="Henter oprettelse..." />;

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (signupForm.first_name.trim().length < 2) {
      setFormError("Navnet skal være mindst 2 tegn.");
      return;
    }
    if (!isValidEmail(signupForm.email)) {
      setFormError("Indtast en gyldig emailadresse, fx navn@email.dk.");
      return;
    }
    if (signupForm.email.trim().toLowerCase() !== signupForm.confirm_email.trim().toLowerCase()) {
      setFormError("De to emailadresser er ikke ens.");
      return;
    }
    if (signupForm.password.length < 8) {
      setFormError("Kodeordet skal være mindst 8 tegn.");
      return;
    }
    if (signupForm.license_plate.trim().length < 2) {
      setFormError("Indtast bilens nummerplade.");
      return;
    }
    if (!locations.length || !plans.length) {
      setFormError("Appen henter stadig vaskehaller og abonnementer. Prøv igen om lidt.");
      return;
    }

    const normalized = {
      ...signupForm,
      first_name: signupForm.first_name.trim(),
      email: signupForm.email.trim().toLowerCase(),
      confirm_email: signupForm.confirm_email.trim().toLowerCase(),
      license_plate: signupForm.license_plate.trim().toUpperCase(),
      phone: signupForm.phone.trim(),
      location_id: signupForm.location_id || locations[0].location_id,
      plan_id: signupForm.plan_id || plans[0].plan_id,
    };
    const details = {
      email: normalized.email,
      first_name: normalized.first_name,
      license_plate: normalized.license_plate,
      location_id: normalized.location_id,
      password: normalized.password,
      phone: normalized.phone,
    };

    try {
      await validateSignupDetails(details);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Oplysningerne kunne ikke godkendes.");
      return;
    }
    updateSignup(normalized);
    goTo("plans");
  }

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader back={() => goTo("welcome")} />
      <section className="auth-content">
        <p className="step-label">Trin 1 af 3</p>
        <h1>Dine oplysninger</h1>
        <p className="screen-intro">Opret din profil. Vi validerer emailen, før du kan fortsætte.</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        <form className="mobile-form" noValidate onSubmit={submit}>
          <label>
            Navn
            <input
              autoComplete="name"
              minLength={2}
              value={signupForm.first_name}
              onChange={(event) => updateSignup({ first_name: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={signupForm.email}
              onChange={(event) => updateSignup({ email: event.target.value })}
            />
          </label>
          <label>
            Gentag email
            <input
              autoComplete="email"
              type="email"
              value={signupForm.confirm_email}
              onChange={(event) => updateSignup({ confirm_email: event.target.value })}
            />
          </label>
          <label>
            Kodeord
            <input
              autoComplete="new-password"
              minLength={8}
              type="password"
              value={signupForm.password}
              onChange={(event) => updateSignup({ password: event.target.value })}
            />
            <small>Mindst 8 tegn</small>
          </label>
          <label>
            Nummerplade
            <input
              autoCapitalize="characters"
              placeholder="AB 12345"
              value={signupForm.license_plate}
              onChange={(event) => updateSignup({ license_plate: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Telefon
            <input
              autoComplete="tel"
              inputMode="tel"
              value={signupForm.phone}
              onChange={(event) => updateSignup({ phone: event.target.value })}
            />
          </label>
          <label>
            Foretrukken vaskehal
            <select
              value={signupForm.location_id || locations[0]?.location_id || 0}
              onChange={(event) => updateSignup({ location_id: Number(event.target.value) })}
            >
              {locations.map((location) => (
                <option key={location.location_id} value={location.location_id}>
                  {location.name} · {location.address}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-button"
            disabled={!locations.length || !plans.length}
            type="submit"
          >
            Fortsæt
          </button>
        </form>
      </section>
    </main>
  );
}
