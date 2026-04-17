import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
  const { error, user: authUser } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;

    if (String(id) === String(authUser.id)) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 },
      );
    }

    await connectDB();
    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User deleted." }, { status: 200 });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
