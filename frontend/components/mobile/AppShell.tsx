"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import DashboardChart from "@/components/DashboardChart";
import type { Dashboard, Location, Plan, UpdateProfilePayload, User, Wash } from "@/types/app";

export type AppTab = "home" | "activity" | "qr" | "locations" | "profile";

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
  onLogout: () => void;
  onSaveProfile: (payload: UpdateProfilePayload) => void;
  onCreateWash: (locationId: number, washType: string) => void;
};

const NAV_ITEMS: Array<{ tab: AppTab; icon: string; label: string }> = [
  { tab: "home", icon: "⌂", label: "Hjem" },
  { tab: "activity", icon: "▥", label: "Aktivitet" },
  { tab: "qr", icon: "▦", label: "QR" },
  { tab: "locations", icon: "⌕", label: "Vaskehaller" },
  { tab: "profile", icon: "○", label: "Profil" },
];

function formatWashDate(value: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function queueLabel(minutes: number) {
  if (minutes <= 3) return { label: "Kort kø", tone: "good" };
  if (minutes <= 7) return { label: "Normal kø", tone: "medium" };
  return { label: "Travlt", tone: "busy" };
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
  onLogout,
  onSaveProfile,
  onCreateWash,
}: AppShellProps) {
  const [tab, setTab] = useState<AppTab>("home");
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [showAllWashes, setShowAllWashes] = useState(false);
  const [profileForm, setProfileForm] = useState<UpdateProfilePayload>({
    first_name: user.first_name,
    license_plate: user.license_plate,
    phone: user.phone ?? "",
    location_id: user.location_id,
    plan_id: user.plan_id,
  });

  const selectedLocation = locations.find((location) => location.location_id === selectedLocationId);
  const filteredLocations = useMemo(() => {
    const search = locationSearch.trim().toLowerCase();
    if (!search) return locations;
    return locations.filter((location) =>
      [location.name, location.city, location.address].some((value) => value.toLowerCase().includes(search)),
    );
  }, [locationSearch, locations]);

  function openLocation(locationId: number) {
    setSelectedLocationId(locationId);
    setTab("locations");
  }

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
  }[tab];

  return (
    <main className="mobile-frame signed-in-app">
      <AppHeader title={title} />
      {notice !== "Klar" ? <div className="app-notice" role="status">{notice}</div> : null}

      <div className="app-scroll-area">
        {tab === "home" ? (
          <section className="app-screen home-screen">
            <div className="greeting-row">
              <div><p>Goddag</p><h1>Hej, {user.first_name}</h1></div>
              <button className="avatar-button" type="button" onClick={() => setTab("profile")} aria-label="Åbn profil">{user.first_name.charAt(0).toUpperCase()}</button>
            </div>

            <article className="member-card">
              <div><span>Dit medlemskab</span><strong>{user.plan_name}</strong><small>{user.license_plate}</small></div>
              <Image alt="Din WashWorld QR-kode" height={86} src="/qr-placeholder.png" width={86} />
              <button className="primary-button compact-button" type="button" onClick={() => setTab("qr")}>Vis QR-kode</button>
            </article>

            <div className="section-heading"><div><p>Tæt på dig</p><h2>Vaskehaller</h2></div><button type="button" onClick={() => setTab("locations")}>Se alle</button></div>
            <div className="home-location-list">
              {locations.slice(0, 3).map((location) => {
                const queue = queueLabel(location.queue_minutes);
                return (
                  <article className="horizontal-location-card" key={location.location_id}>
                    <div className="horizontal-image"><Image alt={location.name} fill sizes="110px" src={location.image} /></div>
                    <div className="horizontal-location-copy"><h3>{location.city}</h3><p>{location.address}</p><span className={`queue-status ${queue.tone}`}>{queue.label} · {location.queue_minutes} min</span></div>
                    <button className="round-arrow" type="button" onClick={() => openLocation(location.location_id)} aria-label={`Åbn ${location.name}`}>›</button>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "activity" ? (
          <section className="app-screen activity-screen">
            <div className="screen-title"><p>Dit overblik</p><h1>Aktivitet</h1></div>
            <DashboardChart data={dashboard?.washes_per_day ?? []} />
            <div className="mobile-stats-grid">
              <article><strong>{washes.length}</strong><span>Seneste vaske</span></article>
              <article><strong>{dashboard?.totals.average_queue ?? 0} min</strong><span>Gns. køtid</span></article>
            </div>
            <div className="section-heading"><div><p>Historik</p><h2>Seneste aktivitet</h2></div>{washes.length > 4 ? <button type="button" onClick={() => setShowAllWashes((current) => !current)}>{showAllWashes ? "Vis mindre" : "Se mere"}</button> : null}</div>
            {washesLoading ? <p className="empty-state">Henter aktivitet...</p> : null}
            {washesError ? <p className="form-error">Kunne ikke hente din aktivitet.</p> : null}
            {!washesLoading && !washesError && recentWashes.length === 0 ? <p className="empty-state">Du har ingen registrerede vaske endnu.</p> : null}
            <div className="activity-list">
              {recentWashes.map((wash) => <article key={wash.wash_id}><div className="activity-icon">✓</div><div><strong>{wash.location_city}</strong><span>{wash.wash_type}</span></div><time>{formatWashDate(wash.washed_at)}</time></article>)}
            </div>
          </section>
        ) : null}

        {tab === "qr" ? (
          <section className="app-screen qr-screen">
            <div className="screen-title"><p>Adgang</p><h1>Scan QR-koden</h1></div>
            <p className="screen-intro">Hold koden foran scanneren ved vaskehallen for at starte din vask.</p>
            <article className="qr-card"><Image alt="WashWorld medlemskode" height={264} src="/qr-placeholder.png" width={264} priority /><span>{user.license_plate}</span></article>
            <div className="qr-help"><strong>{user.plan_name}</strong><span>Aktivt medlemskab</span></div>
          </section>
        ) : null}

        {tab === "locations" && !selectedLocation ? (
          <section className="app-screen locations-screen">
            <div className="screen-title"><p>I nærheden</p><h1>Find vaskehal</h1></div>
            <label className="mobile-search"><span>⌕</span><input aria-label="Søg efter vaskehal" placeholder="Søg efter by eller adresse" value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} /></label>
            <div className="location-card-list">
              {filteredLocations.map((location) => {
                const queue = queueLabel(location.queue_minutes);
                return (
                  <article className="large-location-card" key={location.location_id}>
                    <div className="large-location-image"><Image alt={location.name} fill sizes="390px" src={location.image} /></div>
                    <div className="large-location-content"><div><h2>{location.city}</h2><p>{location.address}</p></div><div className="location-facts"><span>{location.opening_hours}</span><span className={`queue-status ${queue.tone}`}>{queue.label} · {location.queue_minutes} min</span></div><button className="primary-button" type="button" onClick={() => setSelectedLocationId(location.location_id)}>Se vaskehal</button></div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {tab === "locations" && selectedLocation ? (
          <section className="location-detail-screen">
            <div className="location-hero"><Image alt={selectedLocation.name} fill sizes="430px" src={selectedLocation.image} priority /><button className="floating-back" type="button" onClick={() => setSelectedLocationId(null)} aria-label="Tilbage til vaskehaller">←</button></div>
            <div className="location-detail-content"><p className="step-label">WashWorld vaskehal</p><h1>{selectedLocation.city}</h1><p>{selectedLocation.address}</p><div className="detail-status"><article><span>Køtid</span><strong>{selectedLocation.queue_minutes} min</strong></article><article><span>Åbent</span><strong>{selectedLocation.opening_hours}</strong></article></div><div className="wash-includes"><h2>Din vask inkluderer</h2><ul><li>Effektiv forvask</li><li>Skånsom bilvask</li><li>Tørring og lakbeskyttelse</li></ul></div><button className="primary-button" type="button" disabled={isCreatingWash} onClick={() => registerWash(selectedLocation)}>{isCreatingWash ? "Registrerer..." : "Registrer vask"}</button></div>
          </section>
        ) : null}

        {tab === "profile" ? (
          <section className="app-screen profile-screen">
            <div className="profile-intro"><div className="large-avatar">{user.first_name.charAt(0).toUpperCase()}</div><h1>{user.first_name}</h1><p>{user.email}</p></div>
            <article className="profile-plan-card"><span>Dit abonnement</span><strong>{user.plan_name}</strong><small>{user.monthly_price} kr. pr. måned</small></article>
            <form className="mobile-form profile-form" onSubmit={saveProfile}>
              <h2>Personlige oplysninger</h2>
              <label>Navn<input minLength={2} value={profileForm.first_name} onChange={(event) => setProfileForm((current) => ({ ...current, first_name: event.target.value }))} /></label>
              <label>Nummerplade<input value={profileForm.license_plate} onChange={(event) => setProfileForm((current) => ({ ...current, license_plate: event.target.value.toUpperCase() }))} /></label>
              <label>Telefon<input inputMode="tel" value={profileForm.phone} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))} /></label>
              <label>Foretrukken vaskehal<select value={profileForm.location_id} onChange={(event) => setProfileForm((current) => ({ ...current, location_id: Number(event.target.value) }))}>{locations.map((location) => <option key={location.location_id} value={location.location_id}>{location.city}</option>)}</select></label>
              <label>Abonnement<select value={profileForm.plan_id} onChange={(event) => setProfileForm((current) => ({ ...current, plan_id: Number(event.target.value) }))}>{plans.map((plan) => <option key={plan.plan_id} value={plan.plan_id}>{plan.name} · {plan.monthly_price} kr.</option>)}</select></label>
              <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Gemmer..." : "Gem ændringer"}</button>
              <button className="logout-button" type="button" onClick={onLogout}>Log ud</button>
            </form>
          </section>
        ) : null}
      </div>

      <nav className="bottom-navigation" aria-label="App-navigation">
        {NAV_ITEMS.map((item) => <button className={tab === item.tab ? "active" : ""} key={item.tab} type="button" onClick={() => { setTab(item.tab); if (item.tab !== "locations") setSelectedLocationId(null); }}><span>{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
    </main>
  );
}
