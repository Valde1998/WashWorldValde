"use client";

import { useEffect, useState } from "react";

const TOKEN_KEY = "cleanwash_token";

export function useStoredToken() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(TOKEN_KEY);
  });

  useEffect(() => {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
      return;
    }

    window.localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  return {
    token,
    saveToken: setToken,
    clearToken: () => setToken(null),
  };
}
