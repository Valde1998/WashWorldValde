"use client";

import { useCallback, useEffect, useState } from "react";

import { getLocations } from "@/lib/api";
import type { Location } from "@/types/app";

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setLocations(await getLocations());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente vaskehaller");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLocations();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLocations]);

  return { error, isLoading, loadLocations, locations };
}
