import Stripe from "stripe";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";

const getSiteUrl = (req) =>
  process.env.NEXT_PUBLIC_SITE_URL ||
  req.headers.get("origin") ||
  "http://localhost:3000";

const toAbsoluteUrl = (url, req) => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${getSiteUrl(req)}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const stripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
  }

  return new Stripe(secretKey);
};

export async function POST(req) {
  try {
    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const totals = body.totals || {};
    const shippingAddress = body.shippingAddress || {};

    if (!items.length) {
      return NextResponse.json(
        { error: "Order items are required." },
        { status: 400 },
      );
    }

    // Pull primary images by slug so Stripe Checkout can display product thumbnails.
    const slugs = Array.from(
      new Set(
        items
          .map((item) => String(item?.slug || "").trim())
          .filter(Boolean),
      ),
    );

    let imageBySlug = {};
    if (slugs.length) {
      await connectDB();
      const products = await Product.find(
        { slug: { $in: slugs } },
        { slug: 1, gallery: 1 },
      ).lean();
      imageBySlug = products.reduce((acc, product) => {
        const slug = String(product?.slug || "");
        const primary = Array.isArray(product?.gallery)
          ? String(product.gallery[0] || "")
          : "";
        if (slug) acc[slug] = primary;
        return acc;
      }, {});
    }

    const lineItems = items.map((item) => ({
      quantity: Number(item.quantity || 1),
      price_data: {
        currency: "usd",
        unit_amount: Math.round(Number(item.price || 0) * 100),
        product_data: {
          name: String(item.name || "Item"),
          description: String(item.shortDescription || item.description || ""),
          images: (() => {
            const slug = String(item?.slug || "").trim();
            const rawImage =
              String(item?.image || "").trim() || String(imageBySlug[slug] || "");
            const abs = toAbsoluteUrl(rawImage, req);
            return abs ? [abs] : undefined;
          })(),
        },
      },
    }));

    if (Number(totals.shipping || 0) > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(totals.shipping || 0) * 100),
          product_data: {
            name: "Shipping",
            description: "Sandbox shipping charge",
          },
        },
      });
    }

    if (Number(totals.tax || 0) > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(totals.tax || 0) * 100),
          product_data: {
            name: "Tax",
            description: "Sandbox sales tax",
          },
        },
      });
    }

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: String(shippingAddress.email || "").trim().toLowerCase(),
      success_url: `${getSiteUrl(req)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getSiteUrl(req)}/checkout`,
      shipping_address_collection: {
        allowed_countries: ["US", "SE", "GB", "DE", "FR", "NL"],
      },
      metadata: {
        orderTotal: String(totals.total || ""),
      },
    });

    return NextResponse.json(
      { url: session.url, sessionId: session.id },
      { status: 200 },
    );
  } catch (err) {
    console.error("Stripe create session error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
