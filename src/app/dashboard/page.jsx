import DashboardClient from "@/components/store/dashboard-client";

export const metadata = {
  title: "Dashboard",
  description: "Your orders, bookings, and account in one place.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
