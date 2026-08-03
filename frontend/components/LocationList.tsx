"use client";

import Image from "next/image";

import type { Location } from "@/types/app";

type LocationListProps = {
  locations: Location[];
  currentPlanName: string;
  canCreateWash: boolean;
  isCreatingWash: boolean;
  onCreateWash: (locationId: number, washType: string) => void;
};

function queueStatus(minutes: number) {
  if (minutes <= 3) {
    return { label: "Kort ko", className: "good" };
  }

  if (minutes <= 7) {
    return { label: "Normal ko", className: "warning" };
  }

  return { label: "Travlt", className: "danger" };
}

export default function LocationList({
  locations,
  currentPlanName,
  canCreateWash,
  isCreatingWash,
  onCreateWash,
}: LocationListProps) {
  return (
    <section className="panel locations-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Lokationer</p>
          <h2>Vaskehaller</h2>
        </div>
      </div>

      <div className="location-grid">
        {locations.map((location) => {
          const status = queueStatus(location.queue_minutes);

          return (
            <article className="location-card" key={location.location_id}>
              <div className="location-image">
                <Image
                  alt={location.name}
                  fill
                  sizes="(max-width: 720px) 100vw, 33vw"
                  src={location.image}
                />
              </div>
              <div className="location-body">
                <div>
                  <h3>{location.city}</h3>
                  <p>{location.address}</p>
                </div>
                <div className="location-meta">
                  <span>{location.opening_hours}</span>
                  <span className={`queue-pill ${status.className}`}>
                    {status.label} · {location.queue_minutes} min
                  </span>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={!canCreateWash || isCreatingWash}
                  onClick={() => onCreateWash(location.location_id, `${currentPlanName} vask`)}
                >
                  Registrer vask
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
