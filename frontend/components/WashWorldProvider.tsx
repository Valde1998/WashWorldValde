"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

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
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES, type AuthScreen } from "@/lib/routes";
import type {
  Dashboard,
  ForgotPasswordPayload,
  Location,
  LoginPayload,
  Plan,
  ResetPasswordPayload,
  SignupDetailsPayload,
  SignupPayload,
  UpdateProfilePayload,
  User,
  Wash,
} from "@/types/app";

export type SignupDraft = SignupPayload & { confirm_email: string };

const EMPTY_SIGNUP: SignupDraft = {
  first_name: "",
  email: "",
  confirm_email: "",
  password: "",
  license_plate: "",
  phone: "",
  location_id: 0,
  plan_id: 0,
};

type WashWorldContextValue = {
  isHydrated: boolean;
  memberLoading: boolean;
  authLoading: boolean;
  notice: string;
  verificationEmail: string;
  verificationToken: string;
  signupForm: SignupDraft;
  dashboard?: Dashboard;
  locations: Location[];
  plans: Plan[];
  user?: User;
  washes: Wash[];
  washesLoading: boolean;
  washesError: boolean;
  isSaving: boolean;
  isCreatingWash: boolean;
  goTo: (screen: AuthScreen) => void;
  updateSignup: (changes: Partial<SignupDraft>) => void;
  loginUser: (payload: LoginPayload) => void;
  validateSignupDetails: (payload: SignupDetailsPayload) => Promise<void>;
  createAccount: (payload: SignupPayload) => void;
  verifyUserEmail: () => void;
  resendUserVerification: () => void;
  requestPasswordReset: (payload: ForgotPasswordPayload) => void;
  saveNewPassword: (payload: ResetPasswordPayload) => void;
  saveProfile: (payload: UpdateProfilePayload) => void;
  registerWash: (locationId: number, washType: string) => void;
  logout: () => void;
};

const WashWorldContext = createContext<WashWorldContextValue | null>(null);

function WashWorldState({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notice, setNotice] = useState("Klar");
  const [verificationEmailState, setVerificationEmail] = useState("");
  const [signupForm, setSignupForm] = useState<SignupDraft>(EMPTY_SIGNUP);
  const automaticVerificationAttempt = useRef("");

  const verificationEmail = verificationEmailState || searchParams.get("email") || "";
  const verificationToken = searchParams.get("token") || "";
  const pageNotice = searchParams.get("notice") === "expired"
    ? "Din session er udløbet. Log ind igen."
    : notice;
  const isMemberRoute =
    pathname === APP_TAB_ROUTES.home ||
    pathname === APP_TAB_ROUTES.activity ||
    pathname === APP_TAB_ROUTES.qr ||
    pathname === APP_TAB_ROUTES.locations ||
    pathname.startsWith(`${APP_TAB_ROUTES.locations}/`) ||
    pathname === APP_TAB_ROUTES.profile;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(window.localStorage.getItem("washworld_token"));

      const savedNotice = window.sessionStorage.getItem("washworld_notice");
      if (savedNotice) {
        setNotice(savedNotice);
        window.sessionStorage.removeItem("washworld_notice");
      }

      const savedSignup = window.sessionStorage.getItem("washworld_signup");
      if (savedSignup) {
        try {
          setSignupForm({ ...EMPTY_SIGNUP, ...JSON.parse(savedSignup) });
        } catch {
          window.sessionStorage.removeItem("washworld_signup");
        }
      }
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

  function rememberNotice(message: string) {
    window.sessionStorage.setItem("washworld_notice", message);
    setNotice(message);
  }

  function handleProtectedError(error: Error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      window.sessionStorage.setItem("washworld_notice", "Din session er udløbet. Log ind igen.");
      queryClient.removeQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["washes"] });
      setNotice("Din session er udløbet. Log ind igen.");
      router.replace(`${AUTH_SCREEN_ROUTES.login}?notice=expired`);
      return;
    }
    setNotice(error.message);
  }

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

  useEffect(() => {
    if (!isHydrated) return;
    if (isMemberRoute && !token) {
      router.replace(AUTH_SCREEN_ROUTES.login);
    } else if (!isMemberRoute && token && profileQuery.data) {
      router.replace(APP_TAB_ROUTES.home);
    }
  }, [isHydrated, isMemberRoute, profileQuery.data, router, token]);

  function saveSession(session: { token: string }) {
    saveToken(session.token);
    rememberNotice("Du er logget ind");
    void queryClient.invalidateQueries({ queryKey: ["me"] });
    void queryClient.invalidateQueries({ queryKey: ["washes"] });
    router.replace(APP_TAB_ROUTES.home);
  }

  function showVerificationScreen(error: Error) {
    if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
      return false;
    }
    const data = error.data as { verification_required?: unknown; email?: unknown };
    if (data.verification_required !== true || typeof data.email !== "string") return false;

    setVerificationEmail(data.email);
    rememberNotice(error.message);
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
  const validateSignupMutation = useMutation({ mutationFn: validateSignup });
  const signupMutation = useMutation({
    mutationFn: signup,
    onSuccess: (response) => {
      setVerificationEmail(response.email);
      window.sessionStorage.removeItem("washworld_signup");
      rememberNotice(response.message);
      router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(response.email)}`);
    },
    onError: (error) => {
      if (!showVerificationScreen(error)) setNotice(error.message);
    },
  });
  const verifyEmailMutation = useMutation({
    mutationFn: () => verifyEmail({ email: verificationEmail, token: verificationToken }),
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
      rememberNotice(response.message);
      router.push(AUTH_SCREEN_ROUTES.sent);
    },
    onError: (error) => setNotice(error.message),
  });
  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: (response) => {
      rememberNotice(response.message);
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

  const verifyEmailNow = verifyEmailMutation.mutate;
  useEffect(() => {
    if (!isHydrated || pathname !== AUTH_SCREEN_ROUTES.verify || !verificationEmail || !verificationToken) {
      return;
    }
    const attempt = `${verificationEmail}:${verificationToken}`;
    if (automaticVerificationAttempt.current === attempt) return;

    automaticVerificationAttempt.current = attempt;
    setNotice("Bekræfter din email...");
    verifyEmailNow();
  }, [isHydrated, pathname, verificationEmail, verificationToken, verifyEmailNow]);

  function goTo(screen: AuthScreen) {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }

  function updateSignup(changes: Partial<SignupDraft>) {
    setSignupForm((current) => {
      const updated = { ...current, ...changes };
      window.sessionStorage.setItem("washworld_signup", JSON.stringify(updated));
      return updated;
    });
  }

  function logout() {
    clearToken();
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["washes"] });
    setNotice("Du er logget ud");
    router.replace(AUTH_SCREEN_ROUTES.welcome);
  }

  const value: WashWorldContextValue = {
    isHydrated,
    memberLoading: !isHydrated || Boolean(token && profileQuery.isLoading) || (isMemberRoute && !token),
    authLoading:
      loginMutation.isPending ||
      validateSignupMutation.isPending ||
      signupMutation.isPending ||
      verifyEmailMutation.isPending ||
      resendVerificationMutation.isPending ||
      forgotPasswordMutation.isPending ||
      resetPasswordMutation.isPending,
    notice: dashboardQuery.isError && isMemberRoute
      ? "Forbindelsen til backend er afbrudt"
      : pageNotice,
    verificationEmail,
    verificationToken,
    signupForm,
    dashboard: dashboardQuery.data,
    locations: locationsQuery.data ?? [],
    plans: plansQuery.data ?? [],
    user: profileQuery.data,
    washes: washesQuery.data ?? [],
    washesLoading: washesQuery.isLoading,
    washesError: washesQuery.isError,
    isSaving: updateMutation.isPending,
    isCreatingWash: washMutation.isPending,
    goTo,
    updateSignup,
    loginUser: (payload) => loginMutation.mutate(payload),
    validateSignupDetails: (payload) => validateSignupMutation.mutateAsync(payload).then(() => undefined),
    createAccount: (payload) => signupMutation.mutate(payload),
    verifyUserEmail: () => verifyEmailMutation.mutate(),
    resendUserVerification: () => resendVerificationMutation.mutate(),
    requestPasswordReset: (payload) => forgotPasswordMutation.mutate(payload),
    saveNewPassword: (payload) => resetPasswordMutation.mutate(payload),
    saveProfile: (payload) => updateMutation.mutate(payload),
    registerWash: (locationId, washType) => washMutation.mutate({ locationId, washType }),
    logout,
  };

  return <WashWorldContext.Provider value={value}>{children}</WashWorldContext.Provider>;
}

export function WashWorldProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WashWorldState>{children}</WashWorldState>
    </QueryClientProvider>
  );
}

export function useWashWorld() {
  const value = useContext(WashWorldContext);
  if (!value) throw new Error("useWashWorld skal bruges inde i WashWorldProvider");
  return value;
}
