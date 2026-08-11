"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import AppShell from "@/components/mobile/AppShell";
import AuthFlow from "@/components/mobile/AuthFlow";
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
  validateSignup,
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
  LoginPayload,
  ResetPasswordPayload,
  SignupDetailsPayload,
  SignupPayload,
  UpdateProfilePayload,
} from "@/types/app";

function WashWorldContent() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notice, setNotice] = useState("Klar");
  const [verificationEmailState, setVerificationEmail] = useState("");
  const automaticVerificationAttempt = useRef("");

  // Resolve the current URL into either an authentication screen or an app tab.
  const routeAuthScreen = authScreenForPath(pathname);
  const activeTab = appTabForPath(pathname);
  const locationSlug = locationSlugForPath(pathname);
  const verificationEmail = verificationEmailState || searchParams.get("email") || "";
  const verificationToken = searchParams.get("token") || "";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(window.localStorage.getItem("washworld_token"));
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function saveToken(nextToken: string) {
    window.localStorage.setItem("washworld_token", nextToken);
    setToken(nextToken);
  }

  function clearToken() {
    window.localStorage.removeItem("washworld_token");
    setToken(null);
  }

  // Public data loads for every screen; member data only loads with a session.
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

  const locations = locationsQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const profile = profileQuery.data;

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
    setNotice("Klar");
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

  // Keep API writes and their cache updates together in one place.
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
  const validateSignupMutation = useMutation({
    mutationFn: validateSignup,
  });
  const verifyEmailMutation = useMutation({
    mutationFn: () => verifyEmail({ email: verificationEmail, token: verificationToken }),
    onSuccess: saveSession,
    onError: (error) => setNotice(error.message),
  });
  const verifyEmailNow = verifyEmailMutation.mutate;
  useEffect(() => {
    if (!isHydrated || routeAuthScreen !== "verify" || !verificationEmail || !verificationToken) return;

    const attempt = `${verificationEmail}:${verificationToken}`;
    if (automaticVerificationAttempt.current === attempt) return;

    automaticVerificationAttempt.current = attempt;
    setNotice("Bekræfter din email...");
    verifyEmailNow();
  }, [isHydrated, routeAuthScreen, verificationEmail, verificationToken, verifyEmailNow]);
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
    onMutate: () => setNotice("Vasken registreres..."),
    onSuccess: () => setNotice("Vasken er registreret"),
    onError: handleProtectedError,
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
    validateSignupMutation.isPending ||
    signupMutation.isPending ||
    verifyEmailMutation.isPending ||
    resendVerificationMutation.isPending ||
    forgotPasswordMutation.isPending ||
    resetPasswordMutation.isPending;

  // Render one top-level flow for loading, members, or authentication.
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
        washes={washesQuery.data ?? []}
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
      verificationToken={verificationToken}
      onForgotPassword={(payload: ForgotPasswordPayload) => forgotPasswordMutation.mutate(payload)}
      onLogin={(payload: LoginPayload) => loginMutation.mutate(payload)}
      onResendVerification={() => resendVerificationMutation.mutate()}
      onResetPassword={(payload: ResetPasswordPayload) => resetPasswordMutation.mutate(payload)}
      onScreenChange={navigateToAuthScreen}
      onSignup={(payload: SignupPayload) => signupMutation.mutate(payload)}
      onValidateSignup={(payload: SignupDetailsPayload) =>
        validateSignupMutation.mutateAsync(payload).then(() => undefined)
      }
      onVerifyEmail={() => verifyEmailMutation.mutate()}
      plans={plans}
      screen={routeAuthScreen ?? "welcome"}
    />
  );
}

export default function WashWorldApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WashWorldContent />
    </QueryClientProvider>
  );
}
