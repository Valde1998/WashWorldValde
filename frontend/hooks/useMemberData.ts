"use client";

import { useCallback, useEffect, useState } from "react";

import { getMe, getWashes } from "@/lib/api";
import type { User, Wash } from "@/types/app";

export function useMemberData(
  isHydrated: boolean,
  token: string | null,
  handleProtectedError: (error: unknown) => void,
) {
  const [user, setUser] = useState<User>();
  const [washes, setWashes] = useState<Wash[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [washesLoading, setWashesLoading] = useState(false);
  const [washesError, setWashesError] = useState(false);

  const loadMemberData = useCallback(async (currentToken: string) => {
    setProfileLoading(true);
    setWashesLoading(true);
    setWashesError(false);

    try {
      const [nextUser, nextWashes] = await Promise.all([
        getMe(currentToken),
        getWashes(currentToken),
      ]);

      setUser(nextUser);
      setWashes(nextWashes);
    } catch (error) {
      setWashesError(true);
      handleProtectedError(error);
    } finally {
      setProfileLoading(false);
      setWashesLoading(false);
    }
  }, [handleProtectedError]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = window.setTimeout(() => {
      if (!token) {
        setUser(undefined);
        setWashes([]);
        return;
      }

      void loadMemberData(token);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isHydrated, loadMemberData, token]);

  return {
    user,
    setUser,
    washes,
    washesLoading,
    washesError,
    profileLoading,
    loadMemberData,
  };
}
