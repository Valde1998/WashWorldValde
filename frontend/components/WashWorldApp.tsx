"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AuthPanel, { type AuthMode } from "@/components/AuthPanel";
import DashboardChart from "@/components/DashboardChart";
import LocationList from "@/components/LocationList";
import PlanList from "@/components/PlanList";
import ProfilePanel from "@/components/ProfilePanel";
import WashHistory from "@/components/WashHistory";
import { useStoredToken } from "@/hooks/useStoredToken";
import {
  ApiError,
  createWash,
  forgotPassword,
  getDashboard,
  getLocations,
  getMe,
  getPlans,
  getWashes,
  login,
  resetPassword,
  signup,
  updateMe,
} from "@/lib/api";
import type {
  ForgotPasswordPayload,
  Location,
  LoginPayload,
  Plan,
  ResetPasswordPayload,
  SignupPayload,
  UpdateProfilePayload,
  Wash,
} from "@/types/app";

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

export default function WashWorldApp() {
  const queryClient = useQueryClient();
  const { token, saveToken, clearToken } = useStoredToken();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [locationSearch, setLocationSearch] = useState("");
  const [notice, setNotice] = useState("Klar");

  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const locationsQuery = useQuery({ queryKey: ["locations"], queryFn: getLocations });
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const profileQuery = useQuery({
    queryKey: ["me", token],
    queryFn: async () => {
      try {
        return await getMe(token ?? "");
      } catch (error) {
        handleProtectedError(error as Error);
        throw error;
      }
    },
    enabled: Boolean(token),
    retry: false,
  });
  const washesQuery = useQuery({
    queryKey: ["washes", token],
    queryFn: () => getWashes(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  const locations = locationsQuery.data ?? EMPTY_LOCATIONS;
  const plans = plansQuery.data ?? EMPTY_PLANS;
  const profile = profileQuery.data;
  const dashboard = dashboardQuery.data;
  const washesQueryKey = ["washes", token] as const;

  const currentPlanName = useMemo(() => {
    if (profile?.plan_name) {
      return profile.plan_name;
    }

    return plans[1]?.name ?? plans[0]?.name ?? "Plus";
  }, [plans, profile]);

  const filteredLocations = useMemo(() => {
    const search = locationSearch.trim().toLowerCase();

    if (!search) {
      return locations;
    }

    return locations.filter((location) =>
      [location.name, location.city, location.address].some((value) =>
        value.toLowerCase().includes(search),
      ),
    );
  }, [locationSearch, locations]);

  function saveSession(session: { token: string }) {
    saveToken(session.token);
    setNotice("Du er logget ind");
    void queryClient.invalidateQueries({ queryKey: ["me"] });
    void queryClient.invalidateQueries({ queryKey: ["washes"] });
  }

  function handleProtectedError(error: Error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["washes"] });
      setNotice("Din session er udløbet. Log ind igen.");
      return;
    }

    setNotice(error.message);
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

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      setNotice(response.message);
      setAuthMode("reset");
    },
    onError: (error) => setNotice(error.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      setNotice(response.message);
      setAuthMode("login");
    },
    onError: (error) => setNotice(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMe(token ?? "", payload),
    onSuccess: () => {
      setNotice("Profilen er gemt");
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: handleProtectedError,
  });

  const washMutation = useMutation({
    mutationFn: (payload: { locationId: number; washType: string }) =>
      createWash(token ?? "", payload.locationId, payload.washType),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: washesQueryKey });

      const previousWashes = queryClient.getQueryData<Wash[]>(washesQueryKey) ?? [];
      const location = locations.find((item) => item.location_id === payload.locationId);
      const optimisticWash: Wash = {
        wash_id: `optimistic-${Date.now()}`,
        wash_type: payload.washType,
        washed_at: new Date().toISOString(),
        location_name: location?.name ?? "WashWorld",
        location_city: location?.city ?? "Ukendt",
        is_optimistic: true,
      };

      queryClient.setQueryData<Wash[]>(washesQueryKey, [optimisticWash, ...previousWashes]);
      setNotice("Vasken registreres...");

      return { previousWashes };
    },
    onSuccess: () => {
      setNotice("Vasken er registreret");
    },
    onError: (error, _payload, context) => {
      if (context?.previousWashes) {
        queryClient.setQueryData<Wash[]>(washesQueryKey, context.previousWashes);
      }

      handleProtectedError(error);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["washes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  function handleLogout() {
    clearToken();
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

  function handleForgotPassword(payload: ForgotPasswordPayload) {
    forgotPasswordMutation.mutate(payload);
  }

  function handleResetPassword(payload: ResetPasswordPayload) {
    resetPasswordMutation.mutate(payload);
  }

  function handleCreateWash(locationId: number, washType: string) {
    if (!token) {
      setNotice("Log ind for at registrere en vask");
      return;
    }

    washMutation.mutate({ locationId, washType });
  }

  const totals = dashboard?.totals;
  const isAuthLoading =
    loginMutation.isPending ||
    signupMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;
  const apiStatus = dashboardQuery.isError ? "Backend offline" : notice;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Hovedmenu">
        <Image alt="WashWorld" height={36} src="/logo.webp" width={116} priority />
        <nav>
          <a href="#overview">Overblik</a>
          <a href="#locations">Lokationer</a>
          <a href="#account">Konto</a>
        </nav>
      </aside>

      <section className="workspace" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">WashWorld</p>
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
              canCreateWash={Boolean(profile)}
              currentPlanName={currentPlanName}
              hasError={locationsQuery.isError}
              isLoading={locationsQuery.isLoading}
              isCreatingWash={washMutation.isPending}
              locations={filteredLocations}
              onCreateWash={handleCreateWash}
              onSearchChange={setLocationSearch}
              search={locationSearch}
            />
          </div>

          <aside className="side-column" id="account">
            {token && profileQuery.isLoading ? (
              <section className="panel" aria-live="polite">
                <p className="muted-text">Henter profil...</p>
              </section>
            ) : profile ? (
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
                onForgotPassword={handleForgotPassword}
                onLogin={handleLogin}
                onModeChange={setAuthMode}
                onResetPassword={handleResetPassword}
                onSignup={handleSignup}
                plans={plans}
              />
            )}
            <PlanList currentPlanId={profile?.plan_id} plans={plans} />
            <WashHistory
              hasError={washesQuery.isError}
              isLoading={washesQuery.isLoading}
              isLoggedIn={Boolean(profile)}
              washes={washesQuery.data ?? EMPTY_WASHES}
            />
          </aside>
        </section>
      </section>
    </main>
  );
}
