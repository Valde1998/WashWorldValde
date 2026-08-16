"use client";

import { useEffect, useState } from "react";

import { MemberPage } from "@/components/PageLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getDashboard, getLocations, getWashes } from "@/lib/api";
import type { Dashboard, Location, Wash } from "@/types/app";

function formatWashDate(value: string) {
  return new Intl.DateTimeFormat("da-DK", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ActivityChart({ data }: { data: Dashboard["washes_per_day"] }) {
  const bars = data.length
    ? data.map((item) => ({
        label: new Intl.DateTimeFormat("da-DK", { weekday: "short" }).format(new Date(item.day)),
        value: item.washes,
      }))
    : ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"].map((label) => ({ label, value: 0 }));
  const highestValue = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <section className="chart-panel">
      <p className="eyebrow">Aktivitet</p>
      <h2>Vaske seneste uge</h2>
      <div className="simple-chart">
        {bars.map((bar, index) => (
          <div className="chart-column" key={`${bar.label}-${index}`}>
            <div
              className="chart-bar"
              style={{ height: `${(bar.value / highestValue) * 100}%` }}
              title={`${bar.value} vaske`}
            />
            <span>{bar.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ActivityPage() {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [washes, setWashes] = useState<Wash[]>([]);
  const [showAllWashes, setShowAllWashes] = useState(false);
  const { pageLoading, token, user } = useCurrentUser();
  const recentWashes = showAllWashes ? washes : washes.slice(0, 4);

  useEffect(() => {
    if (!user || !token) return;

    async function loadPageData() {
      try {
        setDashboard(await getDashboard());
        setLocations(await getLocations());
        setWashes(await getWashes(token));
      } catch {
        return;
      }
    }

    void loadPageData();
  }, [token, user]);

  return (
    <MemberPage loading={pageLoading} title="Aktivitet">
      <section className="app-screen activity-screen">
        <div className="screen-title">
          <p>Dit overblik</p>
          <h1>Aktivitet</h1>
        </div>
        <ActivityChart data={dashboard?.washes_per_day ?? []} />
        <div className="mobile-stats-grid">
          <article><strong>{washes.length}</strong><span>Seneste vaske</span></article>
          <article><strong>{locations.length}</strong><span>Danske lokationer</span></article>
        </div>
        <div className="section-heading">
          <div><p>Historik</p><h2>Seneste aktivitet</h2></div>
          {washes.length > 4 ? (
            <button type="button" onClick={() => setShowAllWashes((current) => !current)}>
              {showAllWashes ? "Vis mindre" : "Se mere"}
            </button>
          ) : null}
        </div>
        {recentWashes.length === 0 ? (
          <p className="empty-state">Du har ingen registrerede vaske endnu.</p>
        ) : null}
        <div className="activity-list">
          {recentWashes.map((wash) => (
            <article key={wash.wash_id}>
              <div className="activity-icon">✓</div>
              <div><strong>{wash.location_city}</strong><span>{wash.wash_type}</span></div>
              <time>{formatWashDate(wash.washed_at)}</time>
            </article>
          ))}
        </div>
      </section>
    </MemberPage>
  );
}
