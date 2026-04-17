import { NextResponse } from "next/server";
import { authenticate, requireAdmin } from "@/lib/authMiddleware";
import {
  approveReview,
  adminUpdateReview,
  deleteReview,
  rejectReview,
  updateReview,
} from "@/lib/store/reviews-service";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const status = String(body.status || "").toLowerCase();
    const isOwnerEdit = Boolean(body.isOwnerEdit);
    const isAdminEdit = Boolean(body.isAdminEdit);

    let review = null;
    let message = "Review updated.";

    if (isOwnerEdit) {
      review = await updateReview(id, authUser.id, body, false);
      message = "Review updated.";
    } else if (isAdminEdit || (authUser.role === "superadmin" && !status)) {
      review = await adminUpdateReview(id, body);
      message = "Review updated.";
    } else {
      if (!["approved", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid review status." },
          { status: 400 },
        );
      }

      const adminCheck = await requireAdmin(req);
      if (adminCheck.error) return adminCheck.error;

      review =
        status === "approved"
          ? await approveReview(id, authUser.id)
          : await rejectReview(id, authUser.id);
      message = status === "approved" ? "Review approved." : "Review rejected.";
    }

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message,
        review,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Update review error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    const { id } = await params;
    const adminCheck = authUser.role === "superadmin";

    const review = await deleteReview(id, authUser.id, adminCheck);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Review deleted." }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
