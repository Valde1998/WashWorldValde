import { notFound } from "next/navigation";

const SCREENS = [
  "aktivitet",
  "bekraeft-email",
  "betaling",
  "email-sendt",
  "glemt-adgangskode",
  "hjem",
  "login",
  "medlemskab",
  "nulstil-adgangskode",
  "opret-bruger",
  "profil",
  "qr-kode",
  "vaskehaller",
];

type ScreenPageProps = {
  params: Promise<{ screen: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return SCREENS.map((screen) => ({ screen }));
}

export default async function ScreenPage({ params }: ScreenPageProps) {
  const { screen } = await params;

  if (!SCREENS.includes(screen)) {
    notFound();
  }

  return null;
}
