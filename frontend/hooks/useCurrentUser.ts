"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiErrorMessage, getMe } from "@/lib/api";
import { afterRender, clearLogin, readToken, saveNotice, takeNotice } from "@/lib/browserSession";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { User } from "@/types/app";

export function useCurrentUser() {
  const router = useRouter();
  const [notice, setNotice] = useState("Klar");
  const [pageLoading, setPageLoading] = useState(true);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User>();

  useEffect(() => {
    return afterRender(() => {
      async function loadUser() {
        const savedToken = readToken();

        if (!savedToken) {
          router.replace(AUTH_SCREEN_ROUTES.login);
          return;
        }

        try {
          setNotice(takeNotice());
          setToken(savedToken);
          setUser(await getMe(savedToken));
        } catch (error) {
          clearLogin();
          saveNotice(apiErrorMessage(error));
          router.replace(AUTH_SCREEN_ROUTES.login);
        } finally {
          setPageLoading(false);
        }
      }

      void loadUser();
    });
  }, [router]);

  return { notice, pageLoading, setNotice, setUser, token, user };
}
