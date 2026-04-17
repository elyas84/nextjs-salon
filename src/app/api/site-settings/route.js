import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authMiddleware";
import {
  buildSiteSettingsPatch,
  getSiteSettings,
  updateSiteSettings,
} from "@/lib/site-settings-service";

const noStore = { "Cache-Control": "no-store, max-age=0" };

/**
 * Read site marketing images / team list. Public (no secrets in this document).
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("GET /api/site-settings:", err);
    return NextResponse.json(
      { error: "Failed to load site settings" },
      { status: 500, headers: noStore },
    );
  }
}

/**
 * Partial update. Body: any subset of whitelisted image/copy URL fields (see service).
 */
export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json().catch(() => ({}));
    const patch = buildSiteSettingsPatch(body);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400, headers: noStore },
      );
    }
    const settings = await updateSiteSettings(body);
    return NextResponse.json({ settings }, { status: 200, headers: noStore });
  } catch (err) {
    console.error("PATCH /api/site-settings:", err);
    return NextResponse.json(
      { error: "Failed to update site settings" },
      { status: 500, headers: noStore },
    );
  }
}
