"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, getMe, login, updateMe } from "@/lib/api";
import {
  clearStoredToken,
  readStoredToken,
  saveStoredNotice,
  saveStoredToken,
  takeStoredNotice,
} from "@/lib/browserStorage";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES, type AuthScreen } from "@/lib/routes";
import type { LoginPayload, Session, UpdateProfilePayload, User } from "@/types/app";

type UseAuthOptions = {
  requireLogin?: boolean;
  redirectIfLoggedIn?: boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Noget gik galt";
}

export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter();
  const requireLogin = options.requireLogin ?? false;
  const redirectIfLoggedIn = options.redirectIfLoggedIn ?? false;

  const [isHydrated, setIsHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>();
  const [notice, setNotice] = useState("Klar");
  const [authLoading, setAuthLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const goTo = useCallback((screen: AuthScreen) => {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }, [router]);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(undefined);
  }, []);

  const saveSession = useCallback((session: Session) => {
    saveStoredToken(session.token);
    saveStoredNotice("Du er logget ind");
    setToken(session.token);
    setUser(session.user);
    setNotice("Du er logget ind");
    router.replace(APP_TAB_ROUTES.home);
  }, [router]);

  const loadUser = useCallback(async (currentToken: string) => {
    setMemberLoading(true);

    try {
      const profile = await getMe(currentToken);
      setUser(profile);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        saveStoredNotice("Din session er udløbet. Log ind igen.");
        router.replace(`${AUTH_SCREEN_ROUTES.login}?notice=expired`);
      } else {
        setNotice(errorMessage(error));
      }
    } finally {
      setMemberLoading(false);
    }
  }, [clearSession, router]);

  function showVerificationScreen(error: unknown) {
    if (!(error instanceof ApiError) || typeof error.data !== "object" || error.data === null) {
      return false;
    }

    const data = error.data as { verification_required?: unknown; email?: unknown };
    if (data.verification_required !== true || typeof data.email !== "string") return false;

    saveStoredNotice(error.message);
    setNotice(error.message);
    router.push(`${AUTH_SCREEN_ROUTES.verify}?email=${encodeURIComponent(data.email)}`);
    return true;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToken(readStoredToken());

      const savedNotice = takeStoredNotice();
      if (savedNotice) setNotice(savedNotice);

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

  async function saveProfile(payload: UpdateProfilePayload) {
    if (!token) return;
    setIsSaving(true);

    try {
      const updatedUser = await updateMe(token, payload);
      setUser(updatedUser);
      setNotice("Profilen er gemt");
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function logout() {
    clearSession();
    setNotice("Du er logget ud");
    router.replace(AUTH_SCREEN_ROUTES.welcome);
  }

  return {
    authLoading,
    goTo,
    isHydrated,
    isSaving,
    loginUser,
    logout,
    memberLoading: !isHydrated || memberLoading || (requireLogin && (!token || !user)),
    notice,
    saveProfile,
    saveSession,
    setNotice,
    token,
    user,
  };
}
