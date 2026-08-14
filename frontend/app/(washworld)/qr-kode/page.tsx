"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MemberPage } from "@/components/PageLayout";
import { apiErrorMessage, getMe } from "@/lib/api";
import { afterRender, clearLogin, readToken, saveNotice, takeNotice } from "@/lib/browserSession";
import { AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { User } from "@/types/app";

export default function QrCodePage() {
  const router = useRouter();
  const [notice, setNotice] = useState("Klar");
  const [pageLoading, setPageLoading] = useState(true);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    return afterRender(() => {
      async function loadPage() {
        const token = readToken();

        if (!token) {
          router.replace(AUTH_SCREEN_ROUTES.login);
          return;
        }

        try {
          setNotice(takeNotice());
          setUser(await getMe(token));
        } catch (error) {
          clearLogin();
          saveNotice(apiErrorMessage(error));
          router.replace(AUTH_SCREEN_ROUTES.login);
        } finally {
          setPageLoading(false);
        }
      }

      void loadPage();
    });
  }, [router]);

  return (
    <MemberPage loading={pageLoading} notice={notice} title="QR kode">
      {user ? (
        <section className="app-screen qr-screen">
          <div className="screen-title"><p>Adgang</p><h1>Scan QR-koden</h1></div>
          <p className="screen-intro">Hold koden foran scanneren ved vaskehallen for at starte din vask.</p>
          <article className="qr-card">
            <Image alt="WashWorld medlemskode" height={264} priority src="/qr-placeholder.png" width={264} />
            <span>{user.license_plate}</span>
          </article>
          <div className="qr-help"><strong>{user.plan_name}</strong><span>Aktivt medlemskab</span></div>
        </section>
      ) : null}
    </MemberPage>
  );
}
