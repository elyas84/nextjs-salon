import CheckoutClient from "@/components/store/checkout-client";

export default function CheckoutPage() {
  const paypalClientId =
    process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  return <CheckoutClient paypalClientId={paypalClientId} />;
}
