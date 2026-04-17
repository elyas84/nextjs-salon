import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  createTeamMember,
  getTeamForAbout,
} from "@/lib/team-service";

const noStore = { "Cache-Control": "no-store, max-age=0" };

export const dynamic = "force-dynamic";

/** Public: team cards for /about. */
export async function GET() {
  try {
    const data = await getTeamForAbout();
    return NextResponse.json(data, { status: 200, headers: noStore });
  } catch (err) {
    console.error("GET /api/team:", err);
    return NextResponse.json(
      { error: "Failed to load team" },
      { status: 500, headers: noStore },
    );
  }
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const row = await createTeamMember(body);
    if (!row) {
      return NextResponse.json(
        { error: "Name is required, or maximum team size reached." },
        { status: 400, headers: noStore },
      );
    }
    const data = await getTeamForAbout();
    return NextResponse.json({ member: row, ...data }, { status: 201, headers: noStore });
  } catch (err) {
    console.error("POST /api/team:", err);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500, headers: noStore },
    );
  }
}
