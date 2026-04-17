import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/authMiddleware";
import ContactMessage from "@/lib/models/ContactMessage";

function normalizeMessage(item) {
  if (!item) return null;
  return {
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
  };
}

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const wantsRead = body.isRead === true;
    const wantsUnread = body.isRead === false;

    if (!wantsRead && !wantsUnread) {
      return NextResponse.json(
        { error: "Provide isRead: true or false" },
        { status: 400 },
      );
    }

    const update = wantsRead
      ? { isRead: true, readAt: new Date() }
      : { isRead: false, readAt: null };

    const doc = await ContactMessage.findByIdAndUpdate(id, update, {
      new: true,
      lean: true,
    });

    if (!doc) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json(
      { email: normalizeMessage(doc), message: "Updated" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Patch email error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
