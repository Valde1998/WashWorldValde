import WashWorldApp from "@/components/WashWorldApp";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;

  return <WashWorldApp activeTab="locations" locationSlug={slug} />;
}
