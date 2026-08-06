"use client";

import { useCallback, useSyncExternalStore } from "react";

const TOKEN_KEY = "washworld_token";
const TOKEN_EVENT = "washworld-token-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TOKEN_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(TOKEN_EVENT, onStoreChange);
  };
}

function getTokenSnapshot() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function getServerTokenSnapshot() {
  return null;
}

function subscribeToHydration() {
  return () => undefined;
}

export function useStoredToken() {
  const token = useSyncExternalStore(subscribe, getTokenSnapshot, getServerTokenSnapshot);
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const saveToken = useCallback((nextToken: string | null) => {
    if (nextToken) {
      window.localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }

    window.dispatchEvent(new Event(TOKEN_EVENT));
  }, []);

  const clearToken = useCallback(() => saveToken(null), [saveToken]);

  return { token, isHydrated, saveToken, clearToken };
}
