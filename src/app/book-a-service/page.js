import BookingFormSection from "@/components/booking/booking-form-section";
import BookingHero from "@/components/booking/booking-hero";
import BookingInfoStrip from "@/components/booking/booking-info-strip";

export const metadata = {
  title: "Book appointment",
  description:
    "Request a salon visit—choose a service, pick a time, and we’ll confirm by email.",
};

export default function BookAServicePage() {
  return (
    <div className="bg-[#0a0908]">
      <BookingHero />
      <BookingFormSection />
      <BookingInfoStrip />
    </div>
  );
}
