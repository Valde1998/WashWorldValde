"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AppShell from "@/components/mobile/AppShell";
import AuthFlow from "@/components/mobile/AuthFlow";
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
  resendVerification,
  resetPassword,
  signup,
  updateMe,
  verifyEmail,
} from "@/lib/api";
import {
  APP_TAB_ROUTES,
  AUTH_SCREEN_ROUTES,
  appTabForPath,
  authScreenForPath,
  locationSlugForPath,
  type AuthScreen,
} from "@/lib/routes";
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

export default function WashWorldApp() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isHydrated, saveToken, clearToken } = useStoredToken();
  const [notice, setNotice] = useState("Klar");
  const [verificationEmailState, setVerificationEmail] = useState("");

  const routeAuthScreen = authScreenForPath(pathname);
  const activeTab = appTabForPath(pathname);
  const locationSlug = locationSlugForPath(pathname);
  const verificationEmail = verificationEmailState || searchParams.get("email") || "";

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
  const washesQueryKey = ["washes", token] as const;

  useEffect(() => {
    if (!isHydrated) return;

    if (activeTab && !token) {
      router.replace(AUTH_SCREEN_ROUTES.login);
      return;
    }

    if (!activeTab && token && profile) {
      router.replace(APP_TAB_ROUTES.home);
    }
  }, [activeTab, isHydrated, profile, router, token]);

  function navigateToAuthScreen(screen: AuthScreen) {
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }

  function saveSession(session: { token: string }) {
    saveToken(session.token);
    setNotice("Du er logget ind");
    void queryClient.invalidateQueries({ queryKey: ["me"] });
    void queryClient.invalidateQueries({ queryKey: ["washes"] });
    router.replace(APP_TAB_ROUTES.home);
  }

  function handleProtectedError(error: Error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["washes"] });
      setNotice("Din session er udløbet. Log ind igen.");
      router.replace(AUTH_SCREEN_ROUTES.login);
      return;
    }
    setNotice(error.message);
  }

  function showVerificationScreen(error: Error) {
    if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
      return false;
    }

    const data = error.data as { verification_required?: unknown; email?: unknown };
    if (data.verification_required !== true || typeof data.email !== "string") {
      return false;
    }

    setVerificationEmail(data.email);
    setNotice(error.message);
    router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(data.email)}`);
    return true;
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: saveSession,
    onError: (error) => {
      if (!showVerificationScreen(error)) setNotice(error.message);
    },
  });
  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (response) => {
      setVerificationEmail(response.email);
      setNotice(response.message);
      router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(response.email)}`);
    },
    onError: (error) => {
      if (!showVerificationScreen(error)) setNotice(error.message);
    },
  });
  const verifyEmailMutation = useMutation({
    mutationFn: (code: string) => verifyEmail({ email: verificationEmail, code }),
    onSuccess: saveSession,
    onError: (error) => setNotice(error.message),
  });
  const resendVerificationMutation = useMutation({
    mutationFn: () => resendVerification(verificationEmail),
    onSuccess: (response) => setNotice(response.message),
    onError: (error) => setNotice(error.message),
  });
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (response) => {
      setNotice(response.message);
      router.push(AUTH_SCREEN_ROUTES.sent);
    },
    onError: (error) => setNotice(error.message),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      setNotice(response.message);
      router.replace(AUTH_SCREEN_ROUTES.login);
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
    onSuccess: () => setNotice("Vasken er registreret"),
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
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["washes"] });
    setNotice("Du er logget ud");
    router.replace(AUTH_SCREEN_ROUTES.welcome);
  }

  const authLoading =
    loginMutation.isPending ||
    signupMutation.isPending ||
    verifyEmailMutation.isPending ||
    resendVerificationMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;

  if (!isHydrated || (token && profileQuery.isLoading) || (activeTab && !token)) {
    return (
      <main className="mobile-frame app-loading-screen">
        <div className="loading-mark">W</div>
        <p>Henter dit medlemskab...</p>
      </main>
    );
  }

  if (profile && activeTab) {
    return (
      <AppShell
        key={`${profile.user_id}-${profile.first_name}-${profile.license_plate}-${profile.location_id}-${profile.plan_id}`}
        activeTab={activeTab}
        dashboard={dashboardQuery.data}
        isCreatingWash={washMutation.isPending}
        isSaving={updateMutation.isPending}
        locations={locations}
        locationSlug={locationSlug}
        notice={dashboardQuery.isError ? "Forbindelsen til backend er afbrudt" : notice}
        onCreateWash={(locationId, washType) => washMutation.mutate({ locationId, washType })}
        onLogout={handleLogout}
        onSaveProfile={(payload) => updateMutation.mutate(payload)}
        plans={plans}
        user={profile}
        washes={washesQuery.data ?? EMPTY_WASHES}
        washesError={washesQuery.isError}
        washesLoading={washesQuery.isLoading}
      />
    );
  }

  if (profile && !activeTab) {
    return (
      <main className="mobile-frame app-loading-screen">
        <div className="loading-mark">W</div>
        <p>Åbner din startside...</p>
      </main>
    );
  }

  return (
    <AuthFlow
      isLoading={authLoading}
      locations={locations}
      notice={notice}
      verificationEmail={verificationEmail}
      onForgotPassword={(payload: ForgotPasswordPayload) => forgotPasswordMutation.mutate(payload)}
      onLogin={(payload: LoginPayload) => loginMutation.mutate(payload)}
      onResendVerification={() => resendVerificationMutation.mutate()}
      onResetPassword={(payload: ResetPasswordPayload) => resetPasswordMutation.mutate(payload)}
      onScreenChange={navigateToAuthScreen}
      onSignup={(payload: SignupPayload) => signupMutation.mutate(payload)}
      onVerifyEmail={(code) => verifyEmailMutation.mutate(code)}
      plans={plans}
      screen={routeAuthScreen ?? "welcome"}
    />
  );
}
