import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/authMiddleware";
import ContactMessage from "@/lib/models/ContactMessage";

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const deleted = await ContactMessage.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Email deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
