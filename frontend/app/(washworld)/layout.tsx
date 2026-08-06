import { Suspense, type ReactNode } from "react";

import WashWorldApp from "@/components/WashWorldApp";

function RouteLoading() {
  return (
    <main className="mobile-frame app-loading-screen">
      <div className="loading-mark">W</div>
      <p>Åbner WashWorld...</p>
    </main>
  );
}

export default function WashWorldRouteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<RouteLoading />}>
        <WashWorldApp />
      </Suspense>
      {children}
    </>
  );
}
