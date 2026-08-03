"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { Location, Plan, UpdateProfilePayload, User } from "@/types/app";

type ProfilePanelProps = {
  user: User;
  locations: Location[];
  plans: Plan[];
  isSaving: boolean;
  onLogout: () => void;
  onSave: (payload: UpdateProfilePayload) => void;
};

export default function ProfilePanel({
  user,
  locations,
  plans,
  isSaving,
  onLogout,
  onSave,
}: ProfilePanelProps) {
  const [form, setForm] = useState<UpdateProfilePayload>({
    first_name: user.first_name,
    license_plate: user.license_plate,
    phone: user.phone ?? "",
    location_id: user.location_id,
    plan_id: user.plan_id,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Profil</p>
          <h2>{user.first_name}</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onLogout}>
          Log ud
        </button>
      </div>

      <form className="form-grid" onSubmit={submit}>
        <label>
          Navn
          <input
            value={form.first_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                first_name: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Nummerplade
          <input
            value={form.license_plate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                license_plate: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Telefon
          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Fast vaskehal
          <select
            value={form.location_id}
            onChange={(event) =>
              setForm((current) => ({
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
            value={form.plan_id}
            onChange={(event) =>
              setForm((current) => ({
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
        <button className="primary-button" type="submit" disabled={isSaving}>
          Gem profil
        </button>
      </form>
    </section>
  );
}
