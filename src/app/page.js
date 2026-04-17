import HomeClosingCta from "@/components/home/home-closing-cta";
import HomeFeaturedRetail from "@/components/home/home-featured-retail";
import HomeHero from "@/components/home/home-hero";
import HomeServicesJournal from "@/components/home/home-services-journal";
import { listProductsByBadge } from "@/lib/store/products-service";
import { getSiteSettings } from "@/lib/site-settings-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [newProducts, siteSettings] = await Promise.all([
    listProductsByBadge("New", 4),
    getSiteSettings(),
  ]);

  return (
    <div className="bg-[#0a0908]">
      <HomeHero settings={siteSettings} />
      <HomeServicesJournal settings={siteSettings} />
      <HomeFeaturedRetail products={newProducts} />
      <HomeClosingCta />
    </div>
  );
}
