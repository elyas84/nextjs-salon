import { resolveServicesKeyServices } from "@/lib/site-key-services";
import KeyServicesJournal from "@/components/shared/key-services-journal";

export default function ServicesOfferings({ settings }) {
  const ks = resolveServicesKeyServices(settings);
  return <KeyServicesJournal ks={ks} />;
}
