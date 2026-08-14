"use client";

import Image from "next/image";

import { MemberPage } from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";

export default function QrCodePage() {
  const { memberLoading, notice, user } = useAuth({ requireLogin: true });

  return (
    <MemberPage loading={memberLoading} notice={notice} title="QR kode">
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
