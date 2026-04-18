import { getSiteSettings } from "@/lib/site-settings-service";
import { getTestimonialsForAbout } from "@/lib/testimonials-service";
import AboutPageClient from "./about-client";

export const metadata = {
  title: "About",
  description:
    "Our story and guest voices — Studio Salon is a neighborhood studio for cut, color, and care.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [settings, testimonialsData] = await Promise.all([
    getSiteSettings(),
    getTestimonialsForAbout(),
  ]);
  return (
    <AboutPageClient
      settings={settings}
      testimonialsData={testimonialsData}
    />
  );
}
