import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import { listUsersWithStats } from "@/lib/store/users-service";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const users = await listUsersWithStats();
    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error("List users error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
