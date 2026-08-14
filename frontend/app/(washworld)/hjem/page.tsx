"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MemberPage } from "@/components/PageLayout";
import { apiErrorMessage, getLocations, getMe } from "@/lib/api";
import { afterRender, clearLogin, readToken, saveNotice, takeNotice } from "@/lib/browserSession";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { Location, User } from "@/types/app";

export default function HomePage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
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
          setLocations(await getLocations());
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

  if (!user) return <MemberPage loading={pageLoading} notice={notice} title="Hjem" />;

  const preferredLocation = locations.find((location) => location.location_id === user.location_id);
  const homeLocations = [
    preferredLocation,
    ...locations.filter((location) => location.location_id !== user.location_id),
  ]
    .filter((location): location is Location => Boolean(location))
    .slice(0, 3);

  return (
    <MemberPage loading={pageLoading} notice={notice} title="Hjem">
      <section className="app-screen home-screen">
        <div className="greeting-row">
          <div>
            <p>Goddag</p>
            <h1>Hej, {user.first_name}</h1>
          </div>
          <Link aria-label="Åbn profil" className="avatar-button" href={APP_TAB_ROUTES.profile}>
            {user.first_name.charAt(0).toUpperCase()}
          </Link>
        </div>

        <article className="member-card">
          <div>
            <span>Dit medlemskab</span>
            <strong>{user.plan_name}</strong>
            <small>{user.license_plate}</small>
          </div>
          <Image alt="Din WashWorld QR-kode" height={86} src="/qr-placeholder.png" width={86} />
          <Link className="primary-button compact-button route-button" href={APP_TAB_ROUTES.qr}>
            Vis QR-kode
          </Link>
        </article>

        <div className="section-heading">
          <div>
            <p>Din lokale og flere</p>
            <h2>Vaskehaller</h2>
          </div>
          <Link className="section-link" href={APP_TAB_ROUTES.locations}>Se alle</Link>
        </div>
        <div className="home-location-list">
          {homeLocations.map((location) => (
            <article className="horizontal-location-card" key={location.location_id}>
              <div className="horizontal-image">
                <Image alt={location.name} fill sizes="110px" src={location.image} />
              </div>
              <div className="horizontal-location-copy">
                <h3>{location.name}</h3>
                <p>{location.address}</p>
                <span className="queue-status good">Åben {location.opening_hours}</span>
              </div>
              <Link
                aria-label={`Åbn ${location.name}`}
                className="round-arrow"
                href={`${APP_TAB_ROUTES.locations}/${location.slug}`}
              >
                ›
              </Link>
            </article>
          ))}
        </div>
      </section>
    </MemberPage>
  );
}
