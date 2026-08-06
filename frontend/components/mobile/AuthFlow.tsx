"use client";

import Image from "next/image";
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
import type { AuthScreen } from "@/lib/routes";

export type { AuthScreen } from "@/lib/routes";

type AuthFlowProps = {
  screen: AuthScreen;
  locations: Location[];
  plans: Plan[];
  isLoading: boolean;
  notice: string;
  verificationEmail: string;
  onScreenChange: (screen: AuthScreen) => void;
  onLogin: (payload: LoginPayload) => void;
  onSignup: (payload: SignupPayload) => void;
  onVerifyEmail: (code: string) => void;
  onResendVerification: () => void;
  onForgotPassword: (payload: ForgotPasswordPayload) => void;
  onResetPassword: (payload: ResetPasswordPayload) => void;
};

type SignupDraft = SignupPayload & { confirm_email: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,63}$/;

function isValidEmail(value: string) {
  const normalized = value.trim();
  return normalized.length <= 120 && !normalized.includes("..") && EMAIL_PATTERN.test(normalized);
}

function AuthHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header className="auth-header">
      {onBack ? (
        <button className="icon-button auth-back" type="button" onClick={onBack} aria-label="Gå tilbage">
          ←
        </button>
      ) : null}
      <Image alt="WashWorld" height={42} src="/logo.webp" width={136} priority />
    </header>
  );
}

export default function AuthFlow({
  screen,
  locations,
  plans,
  isLoading,
  notice,
  verificationEmail,
  onScreenChange,
  onLogin,
  onSignup,
  onVerifyEmail,
  onResendVerification,
  onForgotPassword,
  onResetPassword,
}: AuthFlowProps) {
  const [formError, setFormError] = useState("");
  const [loginForm, setLoginForm] = useState<LoginPayload>({
    email: "demo@washworld.dk",
    password: "kodeord123",
  });
  const [signupForm, setSignupForm] = useState<SignupDraft>({
    first_name: "",
    email: "",
    confirm_email: "",
    password: "",
    license_plate: "",
    phone: "",
    location_id: 0,
    plan_id: 0,
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetForm, setResetForm] = useState<ResetPasswordPayload>({ reset_key: "", password: "" });
  const [paymentForm, setPaymentForm] = useState({ card: "", expiry: "", cvc: "" });
  const [verificationCode, setVerificationCode] = useState("");

  function goTo(nextScreen: AuthScreen) {
    setFormError("");
    onScreenChange(nextScreen);
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!isValidEmail(loginForm.email)) {
      setFormError("Indtast en gyldig emailadresse.");
      return;
    }
    if (loginForm.password.length < 8) {
      setFormError("Kodeordet skal være mindst 8 tegn.");
      return;
    }
    onLogin({ email: loginForm.email.trim().toLowerCase(), password: loginForm.password });
  }

  function submitDetails(event: FormEvent<HTMLFormElement>) {
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
    setSignupForm((current) => ({
      ...current,
      email: current.email.trim().toLowerCase(),
      confirm_email: current.confirm_email.trim().toLowerCase(),
      location_id: current.location_id || locations[0].location_id,
      plan_id: current.plan_id || plans[0].plan_id,
    }));
    goTo("plans");
  }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (paymentForm.card.replace(/\D/g, "").length !== 16) {
      setFormError("Kortnummeret skal bestå af 16 cifre.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiry)) {
      setFormError("Udløbsdato skal skrives som MM/ÅÅ.");
      return;
    }
    if (!/^\d{3}$/.test(paymentForm.cvc)) {
      setFormError("CVC skal bestå af 3 cifre.");
      return;
    }
    const { confirm_email: _confirmEmail, ...payload } = signupForm;
    onSignup(payload);
  }

  function submitForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!isValidEmail(forgotEmail)) {
      setFormError("Indtast en gyldig emailadresse.");
      return;
    }
    onForgotPassword({ email: forgotEmail.trim().toLowerCase() });
  }

  function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!/^\d{6}$/.test(verificationCode)) {
      setFormError("Indtast den 6-cifrede kode fra emailen.");
      return;
    }
    onVerifyEmail(verificationCode);
  }

  function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (resetForm.reset_key.trim().length !== 32) {
      setFormError("Reset-koden skal bestå af 32 tegn.");
      return;
    }
    if (resetForm.password.length < 8) {
      setFormError("Det nye kodeord skal være mindst 8 tegn.");
      return;
    }
    onResetPassword({ ...resetForm, reset_key: resetForm.reset_key.trim() });
  }

  if (screen === "welcome") {
    return (
      <main className="mobile-frame welcome-screen">
        <Image alt="WashWorld vaskehal" className="welcome-image" fill sizes="430px" src="/location-tilst.webp" priority />
        <div className="welcome-overlay" />
        <div className="welcome-content">
          <Image alt="WashWorld" height={58} src="/logo.webp" width={186} priority />
          <div className="welcome-copy">
            <h1>Ren bil. Nemt medlemskab.</h1>
            <p>Find nærmeste vaskehal, vis din QR-kode og hold styr på alle dine vaske.</p>
          </div>
          <div className="welcome-actions">
            <button className="primary-button" type="button" onClick={() => goTo("login")}>Log ind</button>
            <button className="dark-button" type="button" onClick={() => goTo("signup")}>Bliv medlem</button>
          </div>
        </div>
      </main>
    );
  }

  if (screen === "plans") {
    return (
      <main className="mobile-frame auth-screen">
        <AuthHeader onBack={() => goTo("signup")} />
        <section className="auth-content wide-auth-content">
          <p className="step-label">Trin 2 af 3</p>
          <h1>Vask som passer til dig</h1>
          <p className="screen-intro">Vælg det abonnement, der matcher dit behov. Du kan altid skifte senere.</p>
          <div className="mobile-plan-list">
            {plans.map((plan, index) => {
              const isSelected = signupForm.plan_id === plan.plan_id;
              return (
                <button className={`mobile-plan-card ${isSelected ? "selected" : ""}`} key={plan.plan_id} type="button" onClick={() => setSignupForm((current) => ({ ...current, plan_id: plan.plan_id }))}>
                  {index === 1 ? <span className="popular-badge">Mest populær</span> : null}
                  <span><strong>{plan.name}</strong><small>{plan.description}</small></span>
                  <span className="plan-price"><strong>{plan.monthly_price}</strong><small>kr./md.</small></span>
                </button>
              );
            })}
          </div>
          {formError ? <p className="form-error">{formError}</p> : null}
          <button className="primary-button sticky-action" type="button" disabled={!signupForm.plan_id} onClick={() => goTo("payment")}>Fortsæt til betaling</button>
        </section>
      </main>
    );
  }

  if (screen === "payment") {
    return (
      <main className="mobile-frame auth-screen">
        <AuthHeader onBack={() => goTo("plans")} />
        <section className="auth-content">
          <p className="step-label">Trin 3 af 3</p>
          <h1>Opdater dit betalingskort</h1>
          <p className="screen-intro">Kortoplysningerne bruges kun til demo og bliver ikke gemt.</p>
          {formError ? <p className="form-error">{formError}</p> : null}
          <form className="mobile-form" noValidate onSubmit={submitPayment}>
            <label>Kortnummer<input autoComplete="cc-number" inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456" value={paymentForm.card} onChange={(event) => setPaymentForm((current) => ({ ...current, card: event.target.value }))} /></label>
            <div className="form-row">
              <label>Udløbsdato<input autoComplete="cc-exp" inputMode="numeric" maxLength={5} placeholder="MM/ÅÅ" value={paymentForm.expiry} onChange={(event) => setPaymentForm((current) => ({ ...current, expiry: event.target.value }))} /></label>
              <label>CVC<input autoComplete="cc-csc" inputMode="numeric" maxLength={3} placeholder="123" value={paymentForm.cvc} onChange={(event) => setPaymentForm((current) => ({ ...current, cvc: event.target.value }))} /></label>
            </div>
            <div className="payment-summary"><span>Valgt abonnement</span><strong>{plans.find((plan) => plan.plan_id === signupForm.plan_id)?.name ?? "WashWorld"}</strong></div>
            <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? "Opretter medlemskab..." : "Start medlemskab"}</button>
          </form>
        </section>
      </main>
    );
  }

  if (screen === "sent") {
    return (
      <main className="mobile-frame auth-screen">
        <AuthHeader />
        <section className="auth-content centered-content">
          <div className="success-icon">✓</div>
          <h1>Email er sendt</h1>
          <p className="screen-intro">Hvis emailen findes, ligger reset-koden i appens email-outbox.</p>
          <button className="primary-button" type="button" onClick={() => goTo("reset")}>Jeg har en reset-kode</button>
          <button className="text-button" type="button" onClick={() => goTo("login")}>Gå tilbage til login</button>
        </section>
      </main>
    );
  }

  if (screen === "verify") {
    return (
      <main className="mobile-frame auth-screen">
        <AuthHeader onBack={() => goTo("login")} />
        <section className="auth-content centered-content">
          <div className="success-icon email-icon">@</div>
          <p className="step-label">Sidste trin</p>
          <h1>Bekræft din email</h1>
          <p className="screen-intro">
            Vi har sendt en 6-cifret engangskode til <strong>{verificationEmail}</strong>.
            Koden udløber efter 15 minutter.
          </p>
          {formError ? <p className="form-error">{formError}</p> : null}
          {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}
          <form className="mobile-form verification-form" noValidate onSubmit={submitVerification}>
            <label>
              Bekræftelseskode
              <input
                aria-label="Bekræftelseskode"
                autoComplete="one-time-code"
                className="verification-code-input"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
              />
            </label>
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Bekræfter..." : "Bekræft og log ind"}
            </button>
          </form>
          <button className="text-button" type="button" disabled={isLoading} onClick={onResendVerification}>
            Send en ny kode
          </button>
          <button className="text-button muted-text-button" type="button" onClick={() => goTo("signup")}>
            Brug en anden email
          </button>
        </section>
      </main>
    );
  }

  const screenConfig = {
    login: { title: "Log ind", intro: "Log ind for at se dit medlemskab og dine seneste vaske.", back: "welcome" as AuthScreen },
    signup: { title: "Dine oplysninger", intro: "Opret din profil. Vi validerer emailen, før du kan fortsætte.", back: "welcome" as AuthScreen },
    forgot: { title: "Glemt adgangskode", intro: "Indtast din email, så sender vi en reset-kode.", back: "login" as AuthScreen },
    reset: { title: "Nulstil kodeord", intro: "Indtast koden fra emailen og vælg et nyt kodeord.", back: "login" as AuthScreen },
  }[screen as "login" | "signup" | "forgot" | "reset"];

  return (
    <main className="mobile-frame auth-screen">
      <AuthHeader onBack={() => goTo(screenConfig.back)} />
      <section className="auth-content">
        {screen === "signup" ? <p className="step-label">Trin 1 af 3</p> : null}
        <h1>{screenConfig.title}</h1>
        <p className="screen-intro">{screenConfig.intro}</p>
        {formError ? <p className="form-error">{formError}</p> : null}
        {notice !== "Klar" ? <p className="status-message">{notice}</p> : null}

        {screen === "login" ? (
          <form className="mobile-form" noValidate onSubmit={submitLogin}>
            <label>Email<input autoComplete="email" type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Kodeord<input autoComplete="current-password" minLength={8} type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} /></label>
            <button className="primary-button" type="submit" disabled={isLoading}>{isLoading ? "Logger ind..." : "Log ind"}</button>
            <button className="text-button" type="button" onClick={() => goTo("forgot")}>Glemt adgangskode?</button>
            <p className="auth-switch">Har du ikke en bruger? <button type="button" onClick={() => goTo("signup")}>Bliv medlem</button></p>
          </form>
        ) : null}

        {screen === "signup" ? (
          <form className="mobile-form" noValidate onSubmit={submitDetails}>
            <label>Navn<input autoComplete="name" minLength={2} value={signupForm.first_name} onChange={(event) => setSignupForm((current) => ({ ...current, first_name: event.target.value }))} /></label>
            <label>Email<input autoComplete="email" type="email" value={signupForm.email} onChange={(event) => setSignupForm((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Gentag email<input autoComplete="email" type="email" value={signupForm.confirm_email} onChange={(event) => setSignupForm((current) => ({ ...current, confirm_email: event.target.value }))} /></label>
            <label>Kodeord<input autoComplete="new-password" minLength={8} type="password" value={signupForm.password} onChange={(event) => setSignupForm((current) => ({ ...current, password: event.target.value }))} /><small>Mindst 8 tegn</small></label>
            <label>Nummerplade<input autoCapitalize="characters" placeholder="AB 12345" value={signupForm.license_plate} onChange={(event) => setSignupForm((current) => ({ ...current, license_plate: event.target.value.toUpperCase() }))} /></label>
            <label>Telefon<input autoComplete="tel" inputMode="tel" value={signupForm.phone} onChange={(event) => setSignupForm((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label>Foretrukken vaskehal<select value={signupForm.location_id || locations[0]?.location_id || 0} onChange={(event) => setSignupForm((current) => ({ ...current, location_id: Number(event.target.value) }))}>{locations.map((location) => <option key={location.location_id} value={location.location_id}>{location.name} · {location.address}</option>)}</select></label>
            <button className="primary-button" type="submit" disabled={isLoading || !locations.length || !plans.length}>Fortsæt</button>
          </form>
        ) : null}

        {screen === "forgot" ? (
          <form className="mobile-form" noValidate onSubmit={submitForgot}>
            <label>Email<input autoComplete="email" type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} /></label>
            <button className="primary-button" type="submit" disabled={isLoading}>Send email</button>
          </form>
        ) : null}

        {screen === "reset" ? (
          <form className="mobile-form" noValidate onSubmit={submitReset}>
            <label>Reset-kode<input maxLength={32} minLength={32} value={resetForm.reset_key} onChange={(event) => setResetForm((current) => ({ ...current, reset_key: event.target.value }))} /></label>
            <label>Nyt kodeord<input autoComplete="new-password" minLength={8} type="password" value={resetForm.password} onChange={(event) => setResetForm((current) => ({ ...current, password: event.target.value }))} /></label>
            <button className="primary-button" type="submit" disabled={isLoading}>Gem nyt kodeord</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
