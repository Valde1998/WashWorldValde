import { Suspense, type ReactNode } from "react";

import { WashWorldProvider } from "@/components/WashWorldProvider";

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
    <Suspense fallback={<RouteLoading />}>
      <WashWorldProvider>{children}</WashWorldProvider>
    </Suspense>
  );
}
