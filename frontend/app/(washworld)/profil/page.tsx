"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { MemberPage } from "@/components/PageLayout";
import { useWashWorld } from "@/components/WashWorldProvider";
import type { UpdateProfilePayload } from "@/types/app";

const emptyProfile: UpdateProfilePayload = {
  first_name: "",
  license_plate: "",
  phone: "",
  location_id: 0,
  plan_id: 0,
};

export default function ProfilePage() {
  const { isSaving, locations, logout, plans, saveProfile, user } = useWashWorld();
  const [form, setForm] = useState<UpdateProfilePayload>(emptyProfile);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      setForm({
        first_name: user.first_name,
        license_plate: user.license_plate,
        phone: user.phone ?? "",
        location_id: user.location_id,
        plan_id: user.plan_id,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveProfile(form);
  }

  return (
    <MemberPage title="Min profil">
      {user ? (
        <section className="app-screen profile-screen">
          <div className="profile-intro">
            <div className="large-avatar">{user.first_name.charAt(0).toUpperCase()}</div>
            <h1>{user.first_name}</h1>
            <p>{user.email}</p>
          </div>
          <article className="profile-plan-card">
            <span>Dit abonnement</span>
            <strong>{user.plan_name}</strong>
            <small>{user.monthly_price} kr. pr. måned</small>
          </article>
          <form className="mobile-form profile-form" onSubmit={submit}>
            <h2>Personlige oplysninger</h2>
            <label>
              Navn
              <input minLength={2} value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} />
            </label>
            <label>
              Nummerplade
              <input value={form.license_plate} onChange={(event) => setForm({ ...form, license_plate: event.target.value.toUpperCase() })} />
            </label>
            <label>
              Telefon
              <input inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label>
              Foretrukken vaskehal
              <select value={form.location_id} onChange={(event) => setForm({ ...form, location_id: Number(event.target.value) })}>
                {locations.map((location) => (
                  <option key={location.location_id} value={location.location_id}>{location.name} · {location.address}</option>
                ))}
              </select>
            </label>
            <label>
              Abonnement
              <select value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: Number(event.target.value) })}>
                {plans.map((plan) => (
                  <option key={plan.plan_id} value={plan.plan_id}>{plan.name} · {plan.monthly_price} kr.</option>
                ))}
              </select>
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Gemmer..." : "Gem ændringer"}</button>
            <button className="logout-button" onClick={logout} type="button">Log ud</button>
          </form>
        </section>
      ) : null}
    </MemberPage>
  );
}
