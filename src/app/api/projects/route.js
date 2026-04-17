import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/authMiddleware";
import Project from "@/lib/models/Project";

const normalizeProject = (project) => ({
  ...project,
  _id: String(project._id),
  title: String(project.title || ""),
  description: String(project.description || ""),
  coverImage: String(project.coverImage || ""),
  images: Array.isArray(project.images) ? project.images : [],
  tags: Array.isArray(project.tags) ? project.tags : [],
});

export async function GET(req) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();
    const projects = await Project.find({ createdBy: user.id })
      .sort({ updatedAt: -1 })
      .select("title description coverImage images tags createdBy createdAt updatedAt")
      .lean();

    return NextResponse.json(
      { projects: projects.map(normalizeProject) },
      { status: 200 },
    );
  } catch (err) {
    console.error("List projects error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 },
      );
    }

    const images = Array.isArray(body.images)
      ? body.images
      : String(body.images || "")
          .split(",")
          .map((img) => img.trim())
          .filter(Boolean);

    const tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

    const project = await Project.create({
      title: body.title.trim(),
      description: String(body.description || "").trim(),
      coverImage: String(body.coverImage || "").trim(),
      images,
      tags,
      createdBy: user.id,
    });

    return NextResponse.json(
      { message: "Project created", project: normalizeProject(project.toObject()) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
