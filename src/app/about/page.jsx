import { getSiteSettings } from "@/lib/site-settings-service";
import { getTeamForAbout } from "@/lib/team-service";
import { getTestimonialsForAbout } from "@/lib/testimonials-service";
import AboutPageClient from "./about-client";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [settings, testimonialsData, teamData] = await Promise.all([
    getSiteSettings(),
    getTestimonialsForAbout(),
    getTeamForAbout(),
  ]);
  return (
    <AboutPageClient
      settings={settings}
      testimonialsData={testimonialsData}
      teamData={teamData}
    />
  );
}
