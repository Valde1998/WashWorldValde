"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { takeStoredNotice } from "@/lib/browserStorage";
import { AUTH_SCREEN_ROUTES, type AuthScreen } from "@/lib/routes";

export function usePageNotice() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [notice, setNotice] = useState("Klar");

  const goTo = useCallback((screen: AuthScreen) => {
    setNotice("Klar");
    router.push(AUTH_SCREEN_ROUTES[screen]);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedNotice = takeStoredNotice();
      if (savedNotice) setNotice(savedNotice);
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return { goTo, isHydrated, notice, setNotice };
}
