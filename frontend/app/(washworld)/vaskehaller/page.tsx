"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MemberPage } from "@/components/PageLayout";
import { apiErrorMessage, getLocations, getMe } from "@/lib/api";
import { afterRender, clearLogin, readToken, saveNotice, takeNotice } from "@/lib/browserSession";
import { APP_TAB_ROUTES, AUTH_SCREEN_ROUTES } from "@/lib/routes";
import type { Location } from "@/types/app";

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [notice, setNotice] = useState("Klar");
  const [pageLoading, setPageLoading] = useState(true);
  const search = locationSearch.trim().toLowerCase();
  const filteredLocations = search
    ? locations.filter((location) =>
        [location.name, location.city, location.address].some((value) =>
          value.toLowerCase().includes(search),
        ),
      )
    : locations;

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
          await getMe(token);
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

  return (
    <MemberPage loading={pageLoading} notice={notice} title="Find vaskehal">
      <section className="app-screen locations-screen">
        <div className="screen-title"><p>I nærheden</p><h1>Find vaskehal</h1></div>
        <label className="mobile-search">
          <span>⌕</span>
          <input
            aria-label="Søg efter vaskehal"
            onChange={(event) => setLocationSearch(event.target.value)}
            placeholder="Søg efter by eller adresse"
            value={locationSearch}
          />
        </label>
        <div className="location-card-list">
          {filteredLocations.map((location) => (
            <article className="large-location-card" key={location.location_id}>
              <div className="large-location-image">
                <Image alt={location.name} fill sizes="390px" src={location.image} />
              </div>
              <div className="large-location-content">
                <div><h2>{location.name}</h2><p>{location.address}</p></div>
                <div className="location-facts">
                  <span>Åben {location.opening_hours}</span>
                  <span>
                    {location.halls_count} {location.halls_count === 1 ? "vaskehal" : "vaskehaller"}
                    {location.self_wash_count ? ` · ${location.self_wash_count} Vask Selv` : ""}
                  </span>
                </div>
                <Link className="primary-button route-button" href={`${APP_TAB_ROUTES.locations}/${location.slug}`}>
                  Se vaskehal
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </MemberPage>
  );
}
