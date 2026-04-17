import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  deleteTeamMember,
  getTeamForAbout,
  updateTeamMember,
} from "@/lib/team-service";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const row = await updateTeamMember(id, body);
    if (!row) {
      return NextResponse.json(
        { error: "Not found or invalid fields." },
        { status: 404, headers: noStore },
      );
    }
    const data = await getTeamForAbout();
    return NextResponse.json({ member: row, ...data }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("PATCH /api/team/[id]:", err);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500, headers: noStore },
    );
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const ok = await deleteTeamMember(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Not found." },
        { status: 404, headers: noStore },
      );
    }
    const data = await getTeamForAbout();
    return NextResponse.json(data, { status: 200, headers: noStore });
  } catch (err) {
    console.error("DELETE /api/team/[id]:", err);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500, headers: noStore },
    );
  }
}
