import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/lib/models/Project";

export const dynamic = "force-dynamic";

const normalizeProject = (project) => ({
  _id: String(project._id),
  title: String(project.title || ""),
  description: String(project.description || ""),
  coverImage: String(project.coverImage || ""),
  images: Array.isArray(project.images) ? project.images : [],
  tags: Array.isArray(project.tags) ? project.tags : [],
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

export async function GET() {
  try {
    await connectDB();
    const docs = await Project.find({})
      .sort({ updatedAt: -1 })
      .limit(60)
      .select("title description coverImage images tags createdAt updatedAt")
      .lean();

    return NextResponse.json(
      { projects: docs.map(normalizeProject) },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    console.error("Public projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
