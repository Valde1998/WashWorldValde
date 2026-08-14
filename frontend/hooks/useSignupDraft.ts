"use client";

import { useEffect, useState } from "react";

import {
  EMPTY_SIGNUP,
  clearSignupDraft,
  readSignupDraft,
  saveSignupDraft,
  type SignupDraft,
} from "@/lib/browserStorage";

export function useSignupDraft() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [signupForm, setSignupForm] = useState<SignupDraft>(EMPTY_SIGNUP);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSignupForm(readSignupDraft());
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function updateSignup(changes: Partial<SignupDraft>) {
    setSignupForm((current) => {
      const updated = { ...current, ...changes };
      saveSignupDraft(updated);
      return updated;
    });
  }

  function clearSignup() {
    clearSignupDraft();
    setSignupForm(EMPTY_SIGNUP);
  }

  return { clearSignup, isHydrated, signupForm, updateSignup };
}
