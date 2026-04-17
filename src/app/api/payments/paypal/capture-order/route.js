import { NextResponse } from "next/server";
import { getPaypalAccessToken } from "../_utils";

export async function POST(req) {
  try {
    const body = await req.json();
    const orderID = String(body.orderID || "").trim();

    if (!orderID) {
      return NextResponse.json(
        { error: "orderID is required." },
        { status: 400 },
      );
    }

    const { accessToken, baseUrl } = await getPaypalAccessToken();
    const response = await fetch(
      `${baseUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const rawBody = await response.text();
    let data = null;

    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      data = { raw: rawBody };
    }

    if (!response.ok) {
      console.error("PayPal capture failed:", {
        orderID,
        status: response.status,
        data,
      });
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.details?.[0]?.issue ||
            data?.name ||
            "Unable to capture PayPal order.",
          paypalStatus: response.status,
          paypalError: data,
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(
      { capture: data },
      { status: 200 },
    );
  } catch (err) {
    console.error("PayPal capture order error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
