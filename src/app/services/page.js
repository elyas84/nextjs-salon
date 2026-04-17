import ServicesHero from "@/components/services/services-hero";
import ServicesOfferings from "@/components/services/services-offerings";
import ServicesStandardBanner from "@/components/services/services-standard-banner";
import { getSiteSettings } from "@/lib/site-settings-service";

export const metadata = {
  title: "Services",
  description: "Cuts, color, treatments, and salon services — book online.",
};

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const settings = await getSiteSettings();
  return (
    <div className="bg-[#0a0908]">
      <ServicesHero settings={settings} />
      <ServicesOfferings settings={settings} />
      <ServicesStandardBanner settings={settings} />
    </div>
  );
}
