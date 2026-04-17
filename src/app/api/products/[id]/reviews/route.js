import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { connectDB } from "@/lib/db";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import {
  createReview,
  listPublishedReviewsByProductId,
} from "@/lib/store/reviews-service";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const reviews = await listPublishedReviewsByProductId(id);
    return NextResponse.json({ reviews }, { status: 200 });
  } catch (err) {
    console.error("Get product reviews error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Please choose a rating between 1 and 5." },
        { status: 400 },
      );
    }

    if (comment.length < 10) {
      return NextResponse.json(
        { error: "Please write at least 10 characters." },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(authUser.id).select("name email").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const review = await createReview({
      productId: id,
      userId: authUser.id,
      userName: user.name || user.email,
      userEmail: user.email,
      rating,
      comment,
    });

    return NextResponse.json(
      {
        message: "Review submitted and waiting for approval.",
        review,
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("not found")
      ? 404
      : message.includes("already submitted")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
