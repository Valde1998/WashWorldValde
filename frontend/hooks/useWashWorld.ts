"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
  Session,
  SignupDetailsPayload,
  SignupPayload,
  UpdateProfilePayload,
  User,
  Wash,
} from "@/types/app";

export type SignupDraft = SignupPayload & { confirm_email: string };

type UseWashWorldOptions = {
  autoVerifyEmail?: boolean;
  loadDashboard?: boolean;
  loadLocations?: boolean;
  loadPlans?: boolean;
  loadWashes?: boolean;
  redirectIfLoggedIn?: boolean;
  requireLogin?: boolean;
};

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

const TOKEN_KEY = "washworld_token";
const NOTICE_KEY = "washworld_notice";
const SIGNUP_KEY = "washworld_signup";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Noget gik galt";
}

function readSignupDraft() {
  const savedSignup = window.sessionStorage.getItem(SIGNUP_KEY);
  if (!savedSignup) return EMPTY_SIGNUP;

  try {
    return { ...EMPTY_SIGNUP, ...JSON.parse(savedSignup) };
  } catch {
    window.sessionStorage.removeItem(SIGNUP_KEY);
    return EMPTY_SIGNUP;
  }
}

export function useWashWorld(options: UseWashWorldOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const automaticVerificationAttempt = useRef("");

  const autoVerifyEmail = options.autoVerifyEmail ?? false;
  const loadDashboardOnStart = options.loadDashboard ?? false;
  const loadLocationsOnStart = options.loadLocations ?? false;
  const loadPlansOnStart = options.loadPlans ?? false;
  const loadWashesOnStart = options.loadWashes ?? false;
  const redirectIfLoggedIn = options.redirectIfLoggedIn ?? false;
  const requireLogin = options.requireLogin ?? false;

  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  const [notice, setNotice] = useState("Klar");
  const [signupForm, setSignupForm] = useState<SignupDraft>(EMPTY_SIGNUP);

  const [dashboard, setDashboard] = useState<Dashboard>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [washes, setWashes] = useState<Wash[]>([]);

  const verificationEmail = searchParams.get("email") || "";
  const verificationToken = searchParams.get("token") || "";
  const pageNotice = searchParams.get("notice") === "expired"
    ? "Din session er udløbet. Log ind igen."
    : notice;

  const rememberNotice = useCallback((message: string) => {
    window.sessionStorage.setItem(NOTICE_KEY, message);
    setNotice(message);
  }, []);

  const goTo = useCallback((screen: AuthScreen) => {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }, [router]);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(undefined);
    setWashes([]);
  }, []);

  const saveSession = useCallback((session: Session) => {
    window.localStorage.setItem(TOKEN_KEY, session.token);
    rememberNotice("Du er logget ind");
    setToken(session.token);
    setUser(session.user);
    router.replace(APP_TAB_ROUTES.home);
  }, [rememberNotice, router]);

  const showVerificationScreen = useCallback((error: unknown) => {
    if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
      return false;
    }

    const data = error.data as { verification_required?: unknown; email?: unknown };
    if (data.verification_required !== true || typeof data.email !== "string") return false;

    rememberNotice(error.message);
    router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(data.email)}`);
    return true;
  }, [rememberNotice, router]);

  const loadUser = useCallback(async (currentToken: string) => {
    try {
      setUser(await getMe(currentToken));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        rememberNotice("Din session er udløbet. Log ind igen.");
        router.replace(`${AUTH_SCREEN_ROUTES.login}?notice=expired`);
      } else {
        setNotice(errorMessage(error));
      }
    }
  }, [clearSession, rememberNotice, router]);

  const loadDashboard = useCallback(async () => {
    try {
      setDashboard(await getDashboard());
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      setLocations(await getLocations());
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setPlans(await getPlans());
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, []);

  const loadWashes = useCallback(async () => {
    if (!token) return;

    try {
      setWashes(await getWashes(token));
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(window.localStorage.getItem(TOKEN_KEY));

      const savedNotice = window.sessionStorage.getItem(NOTICE_KEY);
      if (savedNotice) {
        setNotice(savedNotice);
        window.sessionStorage.removeItem(NOTICE_KEY);
      }

      setSignupForm(readSignupDraft());
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = window.setTimeout(() => {
      if (!token) {
        setUser(undefined);
        if (requireLogin) router.replace(AUTH_SCREEN_ROUTES.login);
        return;
      }

      void loadUser(token);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isHydrated, loadUser, requireLogin, router, token]);

  useEffect(() => {
    if (!isHydrated || !redirectIfLoggedIn || !token || !user) return;

    const timer = window.setTimeout(() => {
      router.replace(APP_TAB_ROUTES.home);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isHydrated, redirectIfLoggedIn, router, token, user]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = window.setTimeout(() => {
      if (loadDashboardOnStart) void loadDashboard();
      if (loadLocationsOnStart) void loadLocations();
      if (loadPlansOnStart) void loadPlans();
      if (loadWashesOnStart) void loadWashes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    isHydrated,
    loadDashboard,
    loadDashboardOnStart,
    loadLocations,
    loadLocationsOnStart,
    loadPlans,
    loadPlansOnStart,
    loadWashes,
    loadWashesOnStart,
  ]);

  function updateSignup(changes: Partial<SignupDraft>) {
    setSignupForm((current) => {
      const updated = { ...current, ...changes };
      window.sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  async function loginUser(payload: LoginPayload) {
    try {
      saveSession(await login(payload));
    } catch (error) {
      if (!showVerificationScreen(error)) setNotice(errorMessage(error));
    }
  }

  async function validateSignupDetails(payload: SignupDetailsPayload) {
    await validateSignup(payload);
  }

  async function createAccount(payload: SignupPayload) {
    try {
      const response = await signup(payload);
      window.sessionStorage.removeItem(SIGNUP_KEY);
      rememberNotice(response.message);
      router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      if (!showVerificationScreen(error)) setNotice(errorMessage(error));
    }
  }

  const verifyUserEmail = useCallback(async () => {
    if (!verificationEmail || !verificationToken) {
      setNotice("Bekræftelseslinket mangler email eller token.");
      return;
    }

    try {
      saveSession(await verifyEmail({ email: verificationEmail, token: verificationToken }));
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, [saveSession, verificationEmail, verificationToken]);

  useEffect(() => {
    if (!isHydrated || !autoVerifyEmail || pathname !== AUTH_SCREEN_ROUTES.verify) return;
    if (!verificationEmail || !verificationToken) return;

    const attempt = `${verificationEmail}:${verificationToken}`;
    if (automaticVerificationAttempt.current === attempt) return;

    automaticVerificationAttempt.current = attempt;

    const timer = window.setTimeout(() => {
      void verifyUserEmail();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [autoVerifyEmail, isHydrated, pathname, verificationEmail, verificationToken, verifyUserEmail]);

  async function resendUserVerification() {
    if (!verificationEmail) {
      setNotice("Email mangler, så vi kan ikke sende et nyt link.");
      return;
    }

    try {
      const response = await resendVerification(verificationEmail);
      setNotice(response.message);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function requestPasswordReset(payload: ForgotPasswordPayload) {
    try {
      const response = await forgotPassword(payload);
      rememberNotice(response.message);
      router.push(AUTH_SCREEN_ROUTES.sent);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function saveNewPassword(payload: ResetPasswordPayload) {
    try {
      const response = await resetPassword(payload);
      rememberNotice(response.message);
      router.replace(AUTH_SCREEN_ROUTES.login);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function saveProfile(payload: UpdateProfilePayload) {
    if (!token) return;

    try {
      setUser(await updateMe(token, payload));
      setNotice("Profilen er gemt");
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  async function registerWash(locationId: number, washType: string) {
    if (!token) return;

    try {
      await createWash(token, locationId, washType);
      await loadWashes();
      if (loadDashboardOnStart) await loadDashboard();
      setNotice("Vasken er registreret");
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  function logout() {
    clearSession();
    setNotice("Du er logget ud");
    router.replace(AUTH_SCREEN_ROUTES.welcome);
  }

  return {
    createAccount,
    dashboard,
    goTo,
    isHydrated,
    locations,
    loginUser,
    logout,
    memberLoading: !isHydrated || (requireLogin && (!token || !user)),
    notice: pageNotice,
    plans,
    registerWash,
    requestPasswordReset,
    resendUserVerification,
    saveNewPassword,
    saveProfile,
    signupForm,
    updateSignup,
    user,
    validateSignupDetails,
    verificationEmail,
    verificationToken,
    verifyUserEmail,
    washes,
  };
}
