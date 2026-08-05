import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "WashWorld",
    template: "%s | WashWorld",
  },
  description: "Dit digitale WashWorld-medlemskab med QR-kode, vaskehistorik og vaskehaller i nærheden.",
  applicationName: "WashWorld",
  openGraph: {
    title: "WashWorld",
    description: "Ren bil. Nemt medlemskab.",
    type: "website",
    locale: "da_DK",
    images: [{ url: "/og.png", width: 1792, height: 1024, alt: "WashWorld mobilapp" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WashWorld",
    description: "Ren bil. Nemt medlemskab.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
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
