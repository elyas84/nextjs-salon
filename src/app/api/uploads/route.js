import { NextResponse } from "next/server";
import { authenticate } from "@/lib/authMiddleware";
import { deleteImageByUrl, uploadImageBuffer } from "@/lib/cloudinary";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req) {
  const { error } = await authenticate(req);
  if (error) return error;

  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files.length) {
      return NextResponse.json(
        { error: "At least one image file is required." },
        { status: 400 },
      );
    }

    const uploadType = String(formData.get("uploadType") || "gallery");
    const folder = uploadType === "cover" ? "edc/products/cover" : "edc/products/gallery";

    const uploaded = await Promise.all(
      files.map(async (file) => {
        if (!(file instanceof File)) {
          throw new Error("Invalid file payload.");
        }

        if (!file.type.startsWith("image/")) {
          throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`File too large: ${file.name || "image"}`);
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await uploadImageBuffer({
          buffer,
          folder,
          filename: file.name,
        });

        return {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
        };
      }),
    );

    return NextResponse.json({ files: uploaded }, { status: 200 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed." },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  const { error } = await authenticate(req);
  if (error) return error;

  try {
    const body = await req.json();
    const urls = Array.isArray(body.urls) ? body.urls : [];

    if (!urls.length) {
      return NextResponse.json({ error: "No image URLs provided." }, { status: 400 });
    }

    const results = await Promise.all(urls.map((url) => deleteImageByUrl(url)));
    return NextResponse.json({ results }, { status: 200 });
  } catch (err) {
    console.error("Delete upload error:", err);
    return NextResponse.json(
      { error: err.message || "Image delete failed." },
      { status: 500 },
    );
  }
}
