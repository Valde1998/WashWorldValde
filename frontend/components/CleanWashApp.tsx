"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AuthPanel from "@/components/AuthPanel";
import DashboardChart from "@/components/DashboardChart";
import LocationList from "@/components/LocationList";
import PlanList from "@/components/PlanList";
import ProfilePanel from "@/components/ProfilePanel";
import WashHistory from "@/components/WashHistory";
import {
  createWash,
  getDashboard,
  getLocations,
  getMe,
  getPlans,
  getWashes,
  login,
  signup,
  updateMe,
} from "@/lib/api";
import type { Location, LoginPayload, Plan, SignupPayload, UpdateProfilePayload, Wash } from "@/types/app";

type AuthMode = "login" | "signup";

const EMPTY_LOCATIONS: Location[] = [];
const EMPTY_PLANS: Plan[] = [];
const EMPTY_WASHES: Wash[] = [];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export default function CleanWashApp() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("cleanwash_token");
  });
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [notice, setNotice] = useState("Klar");

  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const profileQuery = useQuery({
    queryKey: ["me", token],
    queryFn: () => getMe(token ?? ""),
    enabled: Boolean(token),
  });
  const washesQuery = useQuery({
    queryKey: ["washes", token],
    queryFn: () => getWashes(token ?? ""),
    enabled: Boolean(token),
  });

  const locations = locationsQuery.data ?? EMPTY_LOCATIONS;
  const plans = plansQuery.data ?? EMPTY_PLANS;
  const profile = profileQuery.data;
  const dashboard = dashboardQuery.data;

  const currentPlanName = useMemo(() => {
    if (profile?.plan_name) {
      return profile.plan_name;
    }

    return plans[1]?.name ?? plans[0]?.name ?? "Plus";
  }, [plans, profile]);

  function saveSession(session: { token: string }) {
    window.localStorage.setItem("cleanwash_token", session.token);
    setToken(session.token);
    setNotice("Du er logget ind");
    void queryClient.invalidateQueries({ queryKey: ["me"] });
    void queryClient.invalidateQueries({ queryKey: ["washes"] });
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: saveSession,
    onError: (error) => setNotice(error.message),
  });

  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: saveSession,
    onError: (error) => setNotice(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMe(token ?? "", payload),
    onSuccess: () => {
      setNotice("Profilen er gemt");
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => setNotice(error.message),
  });

  const washMutation = useMutation({
    mutationFn: (payload: { locationId: number; washType: string }) =>
      createWash(token ?? "", payload.locationId, payload.washType),
    onSuccess: () => {
      setNotice("Vasken er registreret");
      void queryClient.invalidateQueries({ queryKey: ["washes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => setNotice(error.message),
  });

  function handleLogout() {
    window.localStorage.removeItem("cleanwash_token");
    setToken(null);
    setNotice("Du er logget ud");
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["washes"] });
  }

  function handleLogin(payload: LoginPayload) {
    loginMutation.mutate(payload);
  }

  function handleSignup(payload: SignupPayload) {
    signupMutation.mutate(payload);
  }

  function handleCreateWash(locationId: number, washType: string) {
    if (!token) {
      setNotice("Log ind for at registrere en vask");
      return;
    }

    washMutation.mutate({ locationId, washType });
  }

  const totals = dashboard?.totals;
  const isAuthLoading = loginMutation.isPending || signupMutation.isPending;
  const apiStatus = dashboardQuery.isError ? "Backend offline" : notice;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Hovedmenu">
        <Image alt="CleanWash" height={36} src="/logo.webp" width={116} priority />
        <nav>
          <a href="#overview">Overblik</a>
          <a href="#locations">Lokationer</a>
          <a href="#account">Konto</a>
        </nav>
      </aside>

      <section className="workspace" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">CleanWash</p>
            <h1>Vaskehal dashboard</h1>
          </div>
          <div className="status-pill">{apiStatus}</div>
        </header>

        <section className="stats-grid" aria-label="Noegletal">
          <StatCard label="Lokationer" value={totals?.locations ?? "-"} />
          <StatCard label="Abonnementer" value={totals?.plans ?? "-"} />
          <StatCard label="Brugere" value={totals?.users ?? "-"} />
          <StatCard label="Gns. koetid" value={totals?.average_queue ? `${totals.average_queue} min` : "-"} />
        </section>

        <section className="content-grid">
          <div className="main-column" id="locations">
            <DashboardChart data={dashboard?.washes_per_day ?? []} />
            <LocationList
              canCreateWash={Boolean(token)}
              currentPlanName={currentPlanName}
              isCreatingWash={washMutation.isPending}
              locations={locations}
              onCreateWash={handleCreateWash}
            />
          </div>

          <aside className="side-column" id="account">
            {profile ? (
              <ProfilePanel
                key={`${profile.user_id}-${profile.first_name}-${profile.license_plate}-${profile.location_id}-${profile.plan_id}`}
                isSaving={updateMutation.isPending}
                locations={locations}
                onLogout={handleLogout}
                onSave={(payload) => updateMutation.mutate(payload)}
                plans={plans}
                user={profile}
              />
            ) : (
              <AuthPanel
                isLoading={isAuthLoading}
                locations={locations}
                mode={authMode}
                onLogin={handleLogin}
                onModeChange={setAuthMode}
                onSignup={handleSignup}
                plans={plans}
              />
            )}
            <PlanList currentPlanId={profile?.plan_id} plans={plans} />
            <WashHistory isLoggedIn={Boolean(token)} washes={washesQuery.data ?? EMPTY_WASHES} />
          </aside>
        </section>
      </section>
    </main>
  );
}
