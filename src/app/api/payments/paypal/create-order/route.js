import { NextResponse } from "next/server";
import { getPaypalAccessToken } from "../_utils";

export async function POST(req) {
  try {
    const body = await req.json();
    const totals = body.totals || {};
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json(
        { error: "Order items are required." },
        { status: 400 },
      );
    }

    const { accessToken, baseUrl } = await getPaypalAccessToken();
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: Number(totals.total || 0).toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: Number(totals.subtotal || 0).toFixed(2),
                },
                shipping: {
                  currency_code: "USD",
                  value: Number(totals.shipping || 0).toFixed(2),
                },
                tax_total: {
                  currency_code: "USD",
                  value: Number(totals.tax || 0).toFixed(2),
                },
              },
            },
            description: "Sandbox order from VoltMart checkout",
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Unable to create PayPal order." },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json(
      { orderID: data.id, status: data.status },
      { status: 200 },
    );
  } catch (err) {
    console.error("PayPal create order error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
