import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { createProduct, listProducts } from "@/lib/store/products-service";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const products = await listProducts();
    return NextResponse.json({ products }, { status: 200 });
  } catch (err) {
    console.error("List products error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const product = await createProduct(body);

    return NextResponse.json(
      { message: "Product created", product },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
