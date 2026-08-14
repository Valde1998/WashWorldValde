"use client";

import { useCallback, useEffect, useState } from "react";

import { getPlans } from "@/lib/api";
import type { Plan } from "@/types/app";

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setPlans(await getPlans());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke hente abonnementer");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPlans]);

  return { error, isLoading, loadPlans, plans };
}
