"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { MemberPage } from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { useLocations } from "@/hooks/useLocations";
import { useWashes } from "@/hooks/useWashes";
import { APP_TAB_ROUTES } from "@/lib/routes";

export default function LocationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { memberLoading, notice, token, user } = useAuth({ requireLogin: true });
  const { isLoading, locations } = useLocations();
  const {
    isCreatingWash,
    notice: washNotice,
    registerWash,
  } = useWashes(token);
  const location = locations.find((item) => item.slug === slug);
  const pageNotice = washNotice !== "Klar" ? washNotice : notice;

  return (
    <MemberPage loading={memberLoading || isLoading} notice={pageNotice} title="Vaskehal">
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
              disabled={isCreatingWash || !user}
              onClick={() => user && registerWash(location.location_id, `${user.plan_name} vask`)}
              type="button"
            >
              {isCreatingWash ? "Registrerer..." : "Registrer vask"}
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
