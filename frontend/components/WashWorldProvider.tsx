"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useCatalog } from "@/hooks/useCatalog";
import { useMemberData } from "@/hooks/useMemberData";
import {
  ApiError,
  createWash,
  forgotPassword,
  login,
  resendVerification,
  resetPassword,
  signup,
  updateMe,
  validateSignup,
  verifyEmail,
} from "@/lib/api";
import {
  EMPTY_SIGNUP,
  clearSignupDraft,
  clearStoredToken,
  readSignupDraft,
  readStoredToken,
  saveSignupDraft,
  saveStoredNotice,
  saveStoredToken,
  takeStoredNotice,
  type SignupDraft,
} from "@/lib/browserStorage";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES, isMemberRoutePath, type AuthScreen } from "@/lib/routes";
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

export type { SignupDraft } from "@/lib/browserStorage";

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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Noget gik galt";
}

function WashWorldState({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const automaticVerificationAttempt = useRef("");

  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notice, setNotice] = useState("Klar");
  const [authLoading, setAuthLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingWash, setIsCreatingWash] = useState(false);
  const [verificationEmailState, setVerificationEmail] = useState("");
  const [signupForm, setSignupForm] = useState<SignupDraft>(EMPTY_SIGNUP);

  const verificationEmail = verificationEmailState || searchParams.get("email") || "";
  const verificationToken = searchParams.get("token") || "";
  const routeNeedsLogin = isMemberRoutePath(pathname);
  const pageNotice = searchParams.get("notice") === "expired"
    ? "Din session er udløbet. Log ind igen."
    : notice;

  const rememberNotice = useCallback((message: string) => {
    saveStoredNotice(message);
    setNotice(message);
  }, []);

  const saveToken = useCallback((nextToken: string) => {
    saveStoredToken(nextToken);
    setToken(nextToken);
  }, []);

  const clearToken = useCallback(() => {
    clearStoredToken();
    setToken(null);
  }, []);

  const handleProtectedError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      rememberNotice("Din session er udløbet. Log ind igen.");
      router.replace(`${AUTH_SCREEN_ROUTES.login}?notice=expired`);
      return;
    }

    setNotice(errorMessage(error));
  }, [clearToken, rememberNotice, router]);

  const {
    dashboard,
    locations,
    plans,
    catalogLoading,
    loadCatalog,
  } = useCatalog(isHydrated, setNotice);

  const {
    user,
    setUser,
    washes,
    washesLoading,
    washesError,
    profileLoading,
    loadMemberData,
  } = useMemberData(isHydrated, token, handleProtectedError);

  const saveSession = useCallback((session: Session) => {
    saveToken(session.token);
    setUser(session.user);
    rememberNotice("Du er logget ind");
    router.replace(APP_TAB_ROUTES.home);
  }, [rememberNotice, router, saveToken, setUser]);

  const showVerificationScreen = useCallback((error: unknown) => {
    if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
      return false;
    }

    const data = error.data as { verification_required?: unknown; email?: unknown };
    if (data.verification_required !== true || typeof data.email !== "string") return false;

    setVerificationEmail(data.email);
    rememberNotice(error.message);
    router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(data.email)}`);
    return true;
  }, [rememberNotice, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(readStoredToken());

      const savedNotice = takeStoredNotice();
      if (savedNotice) setNotice(savedNotice);

      setSignupForm(readSignupDraft());
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    if (routeNeedsLogin && !token) {
      router.replace(AUTH_SCREEN_ROUTES.login);
      return;
    }

    if (!routeNeedsLogin && token && user) {
      router.replace(APP_TAB_ROUTES.home);
    }
  }, [isHydrated, routeNeedsLogin, router, token, user]);

  useEffect(() => {
    if (!isHydrated || pathname !== AUTH_SCREEN_ROUTES.verify || !verificationEmail || !verificationToken) {
      return;
    }

    const attempt = `${verificationEmail}:${verificationToken}`;
    if (automaticVerificationAttempt.current === attempt) return;

    automaticVerificationAttempt.current = attempt;
    setNotice("Bekræfter din email...");

    async function verifyFromLink() {
      setAuthLoading(true);

      try {
        const session = await verifyEmail({ email: verificationEmail, token: verificationToken });
        saveSession(session);
      } catch (error) {
        setNotice(errorMessage(error));
      } finally {
        setAuthLoading(false);
      }
    }

    void verifyFromLink();
  }, [isHydrated, pathname, saveSession, verificationEmail, verificationToken]);

  function goTo(screen: AuthScreen) {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }

  function updateSignup(changes: Partial<SignupDraft>) {
    setSignupForm((current) => {
      const updated = { ...current, ...changes };
      saveSignupDraft(updated);
      return updated;
    });
  }

  async function loginUser(payload: LoginPayload) {
    setAuthLoading(true);

    try {
      const session = await login(payload);
      saveSession(session);
    } catch (error) {
      if (!showVerificationScreen(error)) setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function validateSignupDetails(payload: SignupDetailsPayload) {
    setAuthLoading(true);

    try {
      await validateSignup(payload);
    } finally {
      setAuthLoading(false);
    }
  }

  async function createAccount(payload: SignupPayload) {
    setAuthLoading(true);

    try {
      const response = await signup(payload);
      setVerificationEmail(response.email);
      clearSignupDraft();
      rememberNotice(response.message);
      router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      if (!showVerificationScreen(error)) setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function verifyUserEmail() {
    if (!verificationEmail || !verificationToken) {
      setNotice("Bekræftelseslinket mangler email eller token.");
      return;
    }

    setAuthLoading(true);

    try {
      const session = await verifyEmail({ email: verificationEmail, token: verificationToken });
      saveSession(session);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function resendUserVerification() {
    if (!verificationEmail) {
      setNotice("Indtast eller åbn en email, før der sendes et nyt link.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await resendVerification(verificationEmail);
      setNotice(response.message);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function requestPasswordReset(payload: ForgotPasswordPayload) {
    setAuthLoading(true);

    try {
      const response = await forgotPassword(payload);
      rememberNotice(response.message);
      router.push(AUTH_SCREEN_ROUTES.sent);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveNewPassword(payload: ResetPasswordPayload) {
    setAuthLoading(true);

    try {
      const response = await resetPassword(payload);
      rememberNotice(response.message);
      router.replace(AUTH_SCREEN_ROUTES.login);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  async function saveProfile(payload: UpdateProfilePayload) {
    if (!token) return;
    setIsSaving(true);

    try {
      const updatedUser = await updateMe(token, payload);
      setUser(updatedUser);
      setNotice("Profilen er gemt");
    } catch (error) {
      handleProtectedError(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function registerWash(locationId: number, washType: string) {
    if (!token) return;
    setIsCreatingWash(true);
    setNotice("Vasken registreres...");

    try {
      await createWash(token, locationId, washType);
      await Promise.all([loadMemberData(token), loadCatalog()]);
      setNotice("Vasken er registreret");
    } catch (error) {
      handleProtectedError(error);
    } finally {
      setIsCreatingWash(false);
    }
  }

  function logout() {
    clearToken();
    setNotice("Du er logget ud");
    router.replace(AUTH_SCREEN_ROUTES.welcome);
  }

  const value: WashWorldContextValue = {
    isHydrated,
    memberLoading: !isHydrated || (routeNeedsLogin && (!token || profileLoading || catalogLoading)),
    authLoading,
    notice: pageNotice,
    verificationEmail,
    verificationToken,
    signupForm,
    dashboard,
    locations,
    plans,
    user,
    washes,
    washesLoading,
    washesError,
    isSaving,
    isCreatingWash,
    goTo,
    updateSignup,
    loginUser,
    validateSignupDetails,
    createAccount,
    verifyUserEmail,
    resendUserVerification,
    requestPasswordReset,
    saveNewPassword,
    saveProfile,
    registerWash,
    logout,
  };

  return <WashWorldContext.Provider value={value}>{children}</WashWorldContext.Provider>;
}

export function WashWorldProvider({ children }: { children: ReactNode }) {
  return <WashWorldState>{children}</WashWorldState>;
}

export function useWashWorld() {
  const value = useContext(WashWorldContext);
  if (!value) throw new Error("useWashWorld skal bruges inde i WashWorldProvider");
  return value;
}
