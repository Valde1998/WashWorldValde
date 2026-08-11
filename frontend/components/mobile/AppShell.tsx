"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

import DashboardChart from "@/components/DashboardChart";
import { APP_TAB_ROUTES, type AppTab } from "@/lib/routes";
import type { Dashboard, Location, Plan, UpdateProfilePayload, User, Wash } from "@/types/app";

export type { AppTab } from "@/lib/routes";

type AppShellProps = {
  user: User;
  dashboard?: Dashboard;
  locations: Location[];
  plans: Plan[];
  washes: Wash[];
  notice: string;
  isSaving: boolean;
  isCreatingWash: boolean;
  washesLoading: boolean;
  washesError: boolean;
  activeTab: AppTab;
  locationSlug?: string | null;
  onLogout: () => void;
  onSaveProfile: (payload: UpdateProfilePayload) => void;
  onCreateWash: (locationId: number, washType: string) => void;
};

const NAV_ITEMS: Array<{ tab: AppTab; href: string; icon: string; label: string }> = [
  { tab: "home", href: APP_TAB_ROUTES.home, icon: "⌂", label: "Hjem" },
  { tab: "activity", href: APP_TAB_ROUTES.activity, icon: "▥", label: "Aktivitet" },
  { tab: "qr", href: APP_TAB_ROUTES.qr, icon: "▦", label: "QR" },
  { tab: "locations", href: APP_TAB_ROUTES.locations, icon: "⌕", label: "Vaskehaller" },
  { tab: "profile", href: APP_TAB_ROUTES.profile, icon: "○", label: "Profil" },
];

function formatWashDate(value: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AppHeader({ title }: { title: string }) {
  return (
    <header className="app-header">
      <Image alt="WashWorld" height={38} src="/logo.webp" width={124} priority />
      <span>{title}</span>
    </header>
  );
}

export default function AppShell({
  user,
  dashboard,
  locations,
  plans,
  washes,
  notice,
  isSaving,
  isCreatingWash,
  washesLoading,
  washesError,
  activeTab,
  locationSlug,
  onLogout,
  onSaveProfile,
  onCreateWash,
}: AppShellProps) {
  const [locationSearch, setLocationSearch] = useState("");
  const [showAllWashes, setShowAllWashes] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    first_name: user.first_name,
    license_plate: user.license_plate,
    phone: user.phone ?? "",
    location_id: user.location_id,
    plan_id: user.plan_id,
  });

  function updateProfile(changes: Partial<UpdateProfilePayload>) {
    setProfileForm((current) => ({ ...current, ...changes }));
  }

  const selectedLocation = locations.find((location) => location.slug === locationSlug);
  const search = locationSearch.trim().toLowerCase();
  const filteredLocations = search
    ? locations.filter((location) =>
        [location.name, location.city, location.address].some((value) =>
          value.toLowerCase().includes(search),
        ),
      )
    : locations;
  const preferredLocation = locations.find(
    (location) => location.location_id === user.location_id,
  );
  const homeLocations = [
    preferredLocation,
    ...locations.filter((location) => location.location_id !== user.location_id),
  ]
    .filter((location): location is Location => Boolean(location))
    .slice(0, 3);

  function registerWash(location: Location) {
    onCreateWash(location.location_id, `${user.plan_name} vask`);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaveProfile(profileForm);
  }

  const recentWashes = showAllWashes ? washes : washes.slice(0, 4);
  const title = {
    home: "Hjem",
    activity: "Aktivitet",
    qr: "QR kode",
    locations: selectedLocation ? "Vaskehal" : "Find vaskehal",
    profile: "Min profil",
  }[activeTab];

  return (
    <main className="mobile-frame signed-in-app">
      <AppHeader title={title} />
      {notice !== "Klar" ? (
        <div className="app-notice" role="status">
          {notice}
        </div>
      ) : null}

      <div className="app-scroll-area">
        {activeTab === "home" ? (
          <section className="app-screen home-screen">
            <div className="greeting-row">
              <div>
                <p>Goddag</p>
                <h1>Hej, {user.first_name}</h1>
              </div>
              <Link
                aria-label="Åbn profil"
                className="avatar-button"
                href={APP_TAB_ROUTES.profile}
              >
                {user.first_name.charAt(0).toUpperCase()}
              </Link>
            </div>

            <article className="member-card">
              <div>
                <span>Dit medlemskab</span>
                <strong>{user.plan_name}</strong>
                <small>{user.license_plate}</small>
              </div>
              <Image alt="Din WashWorld QR-kode" height={86} src="/qr-placeholder.png" width={86} />
              <Link
                className="primary-button compact-button route-button"
                href={APP_TAB_ROUTES.qr}
              >
                Vis QR-kode
              </Link>
            </article>

            <div className="section-heading">
              <div>
                <p>Din lokale og flere</p>
                <h2>Vaskehaller</h2>
              </div>
              <Link className="section-link" href={APP_TAB_ROUTES.locations}>
                Se alle
              </Link>
            </div>
            <div className="home-location-list">
              {homeLocations.map((location) => (
                <article className="horizontal-location-card" key={location.location_id}>
                  <div className="horizontal-image">
                    <Image alt={location.name} fill sizes="110px" src={location.image} />
                  </div>
                  <div className="horizontal-location-copy">
                    <h3>{location.name}</h3>
                    <p>{location.address}</p>
                    <span className="queue-status good">Åben {location.opening_hours}</span>
                  </div>
                  <Link
                    aria-label={`Åbn ${location.name}`}
                    className="round-arrow"
                    href={`${APP_TAB_ROUTES.locations}/${location.slug}`}
                  >
                    ›
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "activity" ? (
          <section className="app-screen activity-screen">
            <div className="screen-title">
              <p>Dit overblik</p>
              <h1>Aktivitet</h1>
            </div>
            <DashboardChart data={dashboard?.washes_per_day ?? []} />
            <div className="mobile-stats-grid">
              <article>
                <strong>{washes.length}</strong>
                <span>Seneste vaske</span>
              </article>
              <article>
                <strong>{locations.length}</strong>
                <span>Danske lokationer</span>
              </article>
            </div>
            <div className="section-heading">
              <div>
                <p>Historik</p>
                <h2>Seneste aktivitet</h2>
              </div>
              {washes.length > 4 ? (
                <button type="button" onClick={() => setShowAllWashes((current) => !current)}>
                  {showAllWashes ? "Vis mindre" : "Se mere"}
                </button>
              ) : null}
            </div>
            {washesLoading ? <p className="empty-state">Henter aktivitet...</p> : null}
            {washesError ? <p className="form-error">Kunne ikke hente din aktivitet.</p> : null}
            {!washesLoading && !washesError && recentWashes.length === 0 ? (
              <p className="empty-state">Du har ingen registrerede vaske endnu.</p>
            ) : null}
            <div className="activity-list">
              {recentWashes.map((wash) => (
                <article key={wash.wash_id}>
                  <div className="activity-icon">✓</div>
                  <div>
                    <strong>{wash.location_city}</strong>
                    <span>{wash.wash_type}</span>
                  </div>
                  <time>{formatWashDate(wash.washed_at)}</time>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "qr" ? (
          <section className="app-screen qr-screen">
            <div className="screen-title">
              <p>Adgang</p>
              <h1>Scan QR-koden</h1>
            </div>
            <p className="screen-intro">Hold koden foran scanneren ved vaskehallen for at starte din vask.</p>
            <article className="qr-card">
              <Image
                alt="WashWorld medlemskode"
                height={264}
                priority
                src="/qr-placeholder.png"
                width={264}
              />
              <span>{user.license_plate}</span>
            </article>
            <div className="qr-help">
              <strong>{user.plan_name}</strong>
              <span>Aktivt medlemskab</span>
            </div>
          </section>
        ) : null}

        {activeTab === "locations" && !selectedLocation ? (
          <section className="app-screen locations-screen">
            <div className="screen-title">
              <p>I nærheden</p>
              <h1>Find vaskehal</h1>
            </div>
            <label className="mobile-search">
              <span>⌕</span>
              <input
                aria-label="Søg efter vaskehal"
                onChange={(event) => setLocationSearch(event.target.value)}
                placeholder="Søg efter by eller adresse"
                value={locationSearch}
              />
            </label>
            <div className="location-card-list">
              {filteredLocations.map((location) => (
                <article className="large-location-card" key={location.location_id}>
                  <div className="large-location-image">
                    <Image alt={location.name} fill sizes="390px" src={location.image} />
                  </div>
                  <div className="large-location-content">
                    <div>
                      <h2>{location.name}</h2>
                      <p>{location.address}</p>
                    </div>
                    <div className="location-facts">
                      <span>Åben {location.opening_hours}</span>
                      <span>
                        {location.halls_count}{" "}
                        {location.halls_count === 1 ? "vaskehal" : "vaskehaller"}
                        {location.self_wash_count
                          ? ` · ${location.self_wash_count} Vask Selv`
                          : ""}
                      </span>
                    </div>
                    <Link
                      className="primary-button route-button"
                      href={`${APP_TAB_ROUTES.locations}/${location.slug}`}
                    >
                      Se vaskehal
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "locations" && selectedLocation ? (
          <section className="location-detail-screen">
            <div className="location-hero">
              <Image
                alt={selectedLocation.name}
                fill
                priority
                sizes="430px"
                src={selectedLocation.image}
              />
              <Link
                aria-label="Tilbage til vaskehaller"
                className="floating-back"
                href={APP_TAB_ROUTES.locations}
              >
                ←
              </Link>
            </div>
            <div className="location-detail-content">
              <p className="step-label">WashWorld vaskehal</p>
              <h1>{selectedLocation.name}</h1>
              <p>{selectedLocation.address}</p>
              <div className="detail-status">
                <article>
                  <span>Vaskehaller</span>
                  <strong>
                    {selectedLocation.halls_count}
                    {selectedLocation.self_wash_count
                      ? ` + ${selectedLocation.self_wash_count} Vask Selv`
                      : ""}
                  </strong>
                </article>
                <article>
                  <span>Åbent</span>
                  <strong>{selectedLocation.opening_hours}</strong>
                </article>
              </div>
              <a
                className="direction-link"
                href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
                rel="noreferrer"
                target="_blank"
              >
                Få rutevejledning
              </a>
              <div className="wash-includes">
                <h2>Din vask inkluderer</h2>
                <ul>
                  <li>Effektiv forvask</li>
                  <li>Skånsom bilvask</li>
                  <li>Tørring og lakbeskyttelse</li>
                </ul>
              </div>
              <button
                className="primary-button"
                disabled={isCreatingWash}
                onClick={() => registerWash(selectedLocation)}
                type="button"
              >
                {isCreatingWash ? "Registrerer..." : "Registrer vask"}
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === "profile" ? (
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
            <form className="mobile-form profile-form" onSubmit={saveProfile}>
              <h2>Personlige oplysninger</h2>
              <label>
                Navn
                <input
                  minLength={2}
                  onChange={(event) => updateProfile({ first_name: event.target.value })}
                  value={profileForm.first_name}
                />
              </label>
              <label>
                Nummerplade
                <input
                  onChange={(event) =>
                    updateProfile({ license_plate: event.target.value.toUpperCase() })
                  }
                  value={profileForm.license_plate}
                />
              </label>
              <label>
                Telefon
                <input
                  inputMode="tel"
                  onChange={(event) => updateProfile({ phone: event.target.value })}
                  value={profileForm.phone}
                />
              </label>
              <label>
                Foretrukken vaskehal
                <select
                  onChange={(event) =>
                    updateProfile({ location_id: Number(event.target.value) })
                  }
                  value={profileForm.location_id}
                >
                  {locations.map((location) => (
                    <option key={location.location_id} value={location.location_id}>
                      {location.name} · {location.address}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Abonnement
                <select
                  onChange={(event) =>
                    updateProfile({ plan_id: Number(event.target.value) })
                  }
                  value={profileForm.plan_id}
                >
                  {plans.map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.name} · {plan.monthly_price} kr.
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary-button" disabled={isSaving} type="submit">
                {isSaving ? "Gemmer..." : "Gem ændringer"}
              </button>
              <button className="logout-button" onClick={onLogout} type="button">
                Log ud
              </button>
            </form>
          </section>
        ) : null}
      </div>

      <nav className="bottom-navigation" aria-label="App-navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            aria-current={activeTab === item.tab ? "page" : undefined}
            className={activeTab === item.tab ? "active" : ""}
            href={item.href}
            key={item.tab}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </Link>
        ))}
      </nav>
    </main>
  );
}
