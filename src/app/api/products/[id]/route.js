import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { deleteProduct, updateProduct } from "@/lib/store/products-service";
import Product from "@/lib/models/Product";
import { connectDB } from "@/lib/db";
import { deleteImageByUrl } from "@/lib/cloudinary";

export async function GET(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const product = await Product.findById(id).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (err) {
    console.error("Get product error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { id } = await params;
    const product = await updateProduct(id, body);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Product updated", product },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const deleted = await deleteProduct(id);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const imageUrls = Array.from(
      new Set([
        ...(Array.isArray(product.gallery) ? product.gallery : []),
        product.coverImage,
      ].filter(Boolean)),
    );

    if (imageUrls.length) {
      const cleanupResults = await Promise.allSettled(
        imageUrls.map((url) => deleteImageByUrl(url)),
      );

      const failedCleanupCount = cleanupResults.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCleanupCount > 0) {
        console.warn(
          `Product deleted, but ${failedCleanupCount} Cloudinary image(s) failed to delete.`,
        );
      }
    }

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete product error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
