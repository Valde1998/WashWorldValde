"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import AppShell from "@/components/mobile/AppShell";
import AuthFlow, { type AuthScreen } from "@/components/mobile/AuthFlow";
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
  const { token, saveToken, clearToken } = useStoredToken();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [notice, setNotice] = useState("Klar");
  const [verificationEmail, setVerificationEmail] = useState("");

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
      setAuthScreen("login");
      setNotice("Din session er udløbet. Log ind igen.");
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
    setAuthScreen("verify");
    setNotice(error.message);
    return true;
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: saveSession,
    onError: (error) => {
      if (!showVerificationScreen(error)) {
        setNotice(error.message);
      }
    },
  });
  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (response) => {
      setVerificationEmail(response.email);
      setNotice(response.message);
      setAuthScreen("verify");
    },
    onError: (error) => {
      if (!showVerificationScreen(error)) {
        setNotice(error.message);
      }
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
      setAuthScreen("sent");
    },
    onError: (error) => setNotice(error.message),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      setNotice(response.message);
      setAuthScreen("login");
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
    setAuthScreen("welcome");
  }

  const authLoading =
    loginMutation.isPending ||
    signupMutation.isPending ||
    verifyEmailMutation.isPending ||
    resendVerificationMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;

  if (token && profileQuery.isLoading) {
    return (
      <main className="mobile-frame app-loading-screen">
        <div className="loading-mark">W</div>
        <p>Henter dit medlemskab...</p>
      </main>
    );
  }

  if (profile) {
    return (
      <AppShell
        key={`${profile.user_id}-${profile.first_name}-${profile.license_plate}-${profile.location_id}-${profile.plan_id}`}
        dashboard={dashboardQuery.data}
        isCreatingWash={washMutation.isPending}
        isSaving={updateMutation.isPending}
        locations={locations}
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
      onScreenChange={setAuthScreen}
      onSignup={(payload: SignupPayload) => signupMutation.mutate(payload)}
      onVerifyEmail={(code) => verifyEmailMutation.mutate(code)}
      plans={plans}
      screen={authScreen}
    />
  );
}
