import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/authMiddleware";
import Project from "@/lib/models/Project";
import { deleteImageByUrl } from "@/lib/cloudinary";

const normalizeProject = (project) => ({
  ...project,
  _id: String(project._id),
  title: String(project.title || ""),
  description: String(project.description || ""),
  coverImage: String(project.coverImage || ""),
  images: Array.isArray(project.images) ? project.images : [],
  tags: Array.isArray(project.tags) ? project.tags : [],
});

export async function GET(req, { params }) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const project = await Project.findOne({ _id: id, createdBy: user.id })
      .select("title description coverImage images tags createdBy createdAt updatedAt")
      .lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { project: normalizeProject(project) },
      { status: 200 },
    );
  } catch (err) {
    console.error("Get project error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
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

    const project = await Project.findOneAndUpdate(
      { _id: id, createdBy: user.id },
      {
        title: body.title.trim(),
        description: String(body.description || "").trim(),
        coverImage: String(body.coverImage || "").trim(),
        images,
        tags,
      },
      { new: true, runValidators: true },
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Project updated", project: normalizeProject(project.toObject()) },
      { status: 200 },
    );
  } catch (err) {
    console.error("Update project error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const { error, user } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const project = await Project.findOneAndDelete({ _id: id, createdBy: user.id });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const imageUrls = Array.from(
      new Set([project.coverImage, ...(project.images || [])].filter(Boolean)),
    );

    if (imageUrls.length) {
      const cleanupResults = await Promise.allSettled(
        imageUrls.map((url) => deleteImageByUrl(url)),
      );

      const failedCleanupCount = cleanupResults.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCleanupCount > 0) {
        console.warn(
          `Project deleted, but ${failedCleanupCount} Cloudinary image(s) failed to delete.`,
        );
      }
    }

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (err) {
    console.error("Delete project error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
