import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/authMiddleware";
import ContactMessage from "@/lib/models/ContactMessage";

const normalizeMessage = (item) => ({
  _id: String(item._id),
  name: String(item.name || ""),
  email: String(item.email || ""),
  company: String(item.company || ""),
  phone: String(item.phone || ""),
  topic: String(item.topic || ""),
  message: String(item.message || ""),
  isRead: Boolean(item.isRead),
  readAt: item.readAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const docs = await ContactMessage.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { emails: docs.map(normalizeMessage) },
      { status: 200 },
    );
  } catch (err) {
    console.error("List emails error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
