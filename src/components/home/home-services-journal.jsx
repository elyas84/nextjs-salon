import { resolveHomeKeyServices } from "@/lib/site-key-services";
import KeyServicesJournal from "@/components/shared/key-services-journal";

export default function HomeServicesJournal({ settings }) {
  const ks = resolveHomeKeyServices(settings);
  return <KeyServicesJournal ks={ks} />;
}
