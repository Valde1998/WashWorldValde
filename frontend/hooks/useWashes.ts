"use client";

import { useCallback, useEffect, useState } from "react";

import { createWash, getWashes } from "@/lib/api";
import type { Wash } from "@/types/app";

export function useWashes(token: string | null) {
  const [washes, setWashes] = useState<Wash[]>([]);
  const [washesLoading, setWashesLoading] = useState(false);
  const [washesError, setWashesError] = useState(false);
  const [isCreatingWash, setIsCreatingWash] = useState(false);
  const [notice, setNotice] = useState("Klar");

  const loadWashes = useCallback(async () => {
    if (!token) return;
    setWashesLoading(true);
    setWashesError(false);

    try {
      setWashes(await getWashes(token));
    } catch {
      setWashesError(true);
    } finally {
      setWashesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWashes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadWashes]);

  async function registerWash(locationId: number, washType: string) {
    if (!token) return;
    setIsCreatingWash(true);
    setNotice("Vasken registreres...");

    try {
      await createWash(token, locationId, washType);
      await loadWashes();
      setNotice("Vasken er registreret");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Vasken kunne ikke registreres");
    } finally {
      setIsCreatingWash(false);
    }
  }

  return {
    isCreatingWash,
    loadWashes,
    notice,
    registerWash,
    washes,
    washesError,
    washesLoading,
  };
}
