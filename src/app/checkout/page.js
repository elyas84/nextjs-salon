import CheckoutClient from "@/components/store/checkout-client";

export const metadata = {
  title: "Checkout",
  description:
    "Shipping address, delivery speed, and payment — complete your Studio Salon order.",
};

export default function CheckoutPage() {
  const paypalClientId =
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  return <CheckoutClient paypalClientId={paypalClientId} />;
}
