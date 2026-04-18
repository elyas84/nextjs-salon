import PlaceOrderClient from "@/components/store/place-order-client";

export const metadata = {
  title: "Order confirmation",
  description:
    "Thank you — your Studio Salon order confirmation and receipt.",
};

export default function PlaceOrderPage() {
  return <PlaceOrderClient />;
}
