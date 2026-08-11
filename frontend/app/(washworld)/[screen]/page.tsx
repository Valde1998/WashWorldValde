import type { Metadata } from "next";
import { notFound } from "next/navigation";

const SCREEN_METADATA: Record<string, Metadata> = {
  aktivitet: { title: "Aktivitet" },
  "bekraeft-email": { title: "Bekræft email" },
  betaling: { title: "Betaling" },
  "email-sendt": { title: "Email sendt" },
  "glemt-adgangskode": { title: "Glemt adgangskode" },
  hjem: { title: "Hjem" },
  login: { title: "Log ind" },
  medlemskab: { title: "Vælg medlemskab" },
  "nulstil-adgangskode": { title: "Nulstil adgangskode" },
  "opret-bruger": { title: "Opret bruger" },
  profil: { title: "Min profil" },
  "qr-kode": { title: "QR-kode" },
  vaskehaller: {
    title: "Find vaskehal",
    description: "Find danske WashWorld-vaskehaller efter by, postnummer eller adresse.",
  },
};

type ScreenPageProps = {
  params: Promise<{ screen: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SCREEN_METADATA).map((screen) => ({ screen }));
}

export async function generateMetadata({ params }: ScreenPageProps): Promise<Metadata> {
  const { screen } = await params;
  return SCREEN_METADATA[screen] ?? {};
}

export default async function ScreenPage({ params }: ScreenPageProps) {
  const { screen } = await params;

  if (!SCREEN_METADATA[screen]) {
    notFound();
  }

  return null;
}
