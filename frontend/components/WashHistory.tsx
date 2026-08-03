"use client";

import Image from "next/image";

import type { Wash } from "@/types/app";

type WashHistoryProps = {
  washes: Wash[];
  isLoggedIn: boolean;
};

export default function WashHistory({ washes, isLoggedIn }: WashHistoryProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Historik</p>
          <h2>Seneste vaske</h2>
        </div>
        <Image alt="QR kode" height={54} src="/qr-placeholder.png" width={54} />
      </div>

      {!isLoggedIn ? (
        <p className="muted-text">Log ind for at se din historik.</p>
      ) : washes.length === 0 ? (
        <p className="muted-text">Ingen vaske endnu.</p>
      ) : (
        <div className="wash-list">
          {washes.map((wash) => (
            <article className="wash-row" key={wash.wash_id}>
              <div>
                <strong>{wash.location_city}</strong>
                <span>{wash.wash_type}</span>
              </div>
              <time dateTime={wash.washed_at}>
                {new Intl.DateTimeFormat("da-DK", {
                  day: "2-digit",
                  month: "short",
                }).format(new Date(wash.washed_at))}
              </time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
