"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { forgotPassword, resetPassword } from "@/lib/api";
import { saveStoredNotice } from "@/lib/browserStorage";
import { AUTH_SCREEN_ROUTES, type AuthScreen } from "@/lib/routes";
import type { ForgotPasswordPayload, ResetPasswordPayload } from "@/types/app";
import { usePageNotice } from "@/hooks/usePageNotice";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Noget gik galt";
}

export function usePasswordReset() {
  const router = useRouter();
  const { isHydrated, notice, setNotice } = usePageNotice();
  const [authLoading, setAuthLoading] = useState(false);

  function goTo(screen: AuthScreen) {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }

  async function requestPasswordReset(payload: ForgotPasswordPayload) {
    setAuthLoading(true);

    try {
      const response = await forgotPassword(payload);
      saveStoredNotice(response.message);
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
      saveStoredNotice(response.message);
      router.replace(AUTH_SCREEN_ROUTES.login);
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  }

  return {
    authLoading,
    goTo,
    isHydrated,
    notice,
    requestPasswordReset,
    saveNewPassword,
  };
}
