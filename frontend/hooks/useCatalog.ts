"use client";

import { useCallback, useEffect, useState } from "react";

import { getDashboard, getLocations, getPlans } from "@/lib/api";
import type { Dashboard, Location, Plan } from "@/types/app";

export function useCatalog(isHydrated: boolean, setNotice: (message: string) => void) {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [locations, setLocations] = useState<Location[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);

    try {
      const [nextDashboard, nextLocations, nextPlans] = await Promise.all([
        getDashboard(),
        getLocations(),
        getPlans(),
      ]);

      setDashboard(nextDashboard);
      setLocations(nextLocations);
      setPlans(nextPlans);
    } catch {
      setNotice("Forbindelsen til backend er afbrudt");
    } finally {
      setCatalogLoading(false);
    }
  }, [setNotice]);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = window.setTimeout(() => {
      void loadCatalog();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isHydrated, loadCatalog]);

  return {
    dashboard,
    locations,
    plans,
    catalogLoading,
    loadCatalog,
  };
}
