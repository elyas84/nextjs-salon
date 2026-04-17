import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey);
};

export async function GET(req) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) {
      return NextResponse.json(
        { error: "session_id is required." },
        { status: 400 },
      );
    }

    const session = await stripe().checkout.sessions.retrieve(sessionId);

    return NextResponse.json(
      {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email,
        client_reference_id: session.client_reference_id,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Stripe session lookup error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
