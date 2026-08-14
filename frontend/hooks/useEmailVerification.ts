"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resendVerification, verifyEmail } from "@/lib/api";
import { saveStoredNotice, saveStoredToken, takeStoredNotice } from "@/lib/browserStorage";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES, type AuthScreen } from "@/lib/routes";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Noget gik galt";
}

export function useEmailVerification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const automaticAttempt = useRef("");

  const [isHydrated, setIsHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [notice, setNotice] = useState("Klar");

  const verificationEmail = searchParams.get("email") || "";
  const verificationToken = searchParams.get("token") || "";

  const goTo = useCallback((screen: AuthScreen) => {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }, [router]);

  const saveSession = useCallback((token: string) => {
    saveStoredToken(token);
    saveStoredNotice("Du er logget ind");
    router.replace(APP_TAB_ROUTES.home);
  }, [router]);

  const verifyUserEmail = useCallback(async () => {
    if (!verificationEmail || !verificationToken) {
      setNotice("Bekræftelseslinket mangler email eller token.");
      return;
    }

    setAuthLoading(true);

    try {
      const session = await verifyEmail({ email: verificationEmail, token: verificationToken });
      saveSession(session.token);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }, [saveSession, verificationEmail, verificationToken]);

  async function resendUserVerification() {
    if (!verificationEmail) {
      setNotice("Email mangler, så vi kan ikke sende et nyt link.");
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedNotice = takeStoredNotice();
      if (savedNotice) setNotice(savedNotice);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated || !verificationEmail || !verificationToken) return;

    const attempt = `${verificationEmail}:${verificationToken}`;
    if (automaticAttempt.current === attempt) return;

    automaticAttempt.current = attempt;
    setNotice("Bekræfter din email...");
    void verifyUserEmail();
  }, [isHydrated, verificationEmail, verificationToken, verifyUserEmail]);

  return {
    authLoading,
    goTo,
    isHydrated,
    notice,
    resendUserVerification,
    verificationEmail,
    verificationToken,
    verifyUserEmail,
  };
}
