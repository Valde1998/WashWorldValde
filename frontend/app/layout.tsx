import type { Metadata } from "next";
import type { ReactNode } from "react";

import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "WashWorld",
  description: "En simpel fullstack vaskehal-app med Next.js og Flask.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="da">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
