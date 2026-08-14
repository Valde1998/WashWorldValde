"use client";

import { useCallback, useEffect, useState } from "react";

import { getDashboard } from "@/lib/api";
import type { Dashboard } from "@/types/app";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setDashboard(await getDashboard());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  return { dashboard, error, isLoading, loadDashboard };
}
