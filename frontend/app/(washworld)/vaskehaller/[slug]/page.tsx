"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { MemberPage } from "@/components/PageLayout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { createWash, getLocations } from "@/lib/api";
import { APP_TAB_ROUTES } from "@/lib/routes";
import type { Location } from "@/types/app";

export default function LocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [locations, setLocations] = useState<Location[]>([]);
  const { pageLoading, token, user } = useCurrentUser();
  const location = locations.find((item) => item.slug === slug);

  useEffect(() => {
    if (!user) return;

    void getLocations()
      .then(setLocations)
      .catch(() => undefined);
  }, [user]);

  async function registerWash(locationId: number, washType: string) {
    if (!token) return;

    try {
      await createWash(token, locationId, washType);
    } catch {
      return;
    }
  }

  return (
    <MemberPage loading={pageLoading} title="Vaskehal">
      {location ? (
        <section className="location-detail-screen">
          <div className="location-hero">
            <Image alt={location.name} fill priority sizes="430px" src={location.image} />
            <Link aria-label="Tilbage til vaskehaller" className="floating-back" href={APP_TAB_ROUTES.locations}>←</Link>
          </div>
          <div className="location-detail-content">
            <p className="step-label">WashWorld vaskehal</p>
            <h1>{location.name}</h1>
            <p>{location.address}</p>
            <div className="detail-status">
              <article>
                <span>Vaskehaller</span>
                <strong>{location.halls_count}{location.self_wash_count ? ` + ${location.self_wash_count} Vask Selv` : ""}</strong>
              </article>
              <article><span>Åbent</span><strong>{location.opening_hours}</strong></article>
            </div>
            <a
              className="direction-link"
              href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
              rel="noreferrer"
              target="_blank"
            >
              Få rutevejledning
            </a>
            <div className="wash-includes">
              <h2>Din vask inkluderer</h2>
              <ul><li>Effektiv forvask</li><li>Skånsom bilvask</li><li>Tørring og lakbeskyttelse</li></ul>
            </div>
            <button
              className="primary-button"
              disabled={!user}
              onClick={() => user && registerWash(location.location_id, `${user.plan_name} vask`)}
              type="button"
            >
              Registrer vask
            </button>
          </div>
        </section>
      ) : (
        <section className="app-screen">
          <h1>Vaskehallen blev ikke fundet</h1>
          <Link className="primary-button route-button" href={APP_TAB_ROUTES.locations}>Se alle vaskehaller</Link>
        </section>
      )}
    </MemberPage>
  );
}
