import { v2 as cloudinary } from "cloudinary";

let configured = false;

const ensureCloudinaryConfig = () => {
  if (configured) return;

  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ url: process.env.CLOUDINARY_URL });
    configured = true;
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const missing = [];
  if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

  if (missing.length) {
    throw new Error(
      `Missing Cloudinary environment variable(s): ${missing.join(", ")}`,
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
};

export const uploadImageBuffer = async ({
  buffer,
  folder = "edc/projects",
  filename,
}) => {
  ensureCloudinaryConfig();

  return await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        use_filename: Boolean(filename),
        unique_filename: true,
        filename_override: filename || undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("res.cloudinary.com")) return null;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.findIndex((part) => part === "upload");
    if (uploadIndex === -1) return null;

    const publicIdParts = parts.slice(uploadIndex + 1);
    if (!publicIdParts.length) return null;

    // remove optional version segment like v1712345678
    if (/^v\d+$/.test(publicIdParts[0])) {
      publicIdParts.shift();
    }

    const last = publicIdParts[publicIdParts.length - 1];
    if (!last) return null;

    publicIdParts[publicIdParts.length - 1] = last.replace(/\.[^.]+$/, "");
    return publicIdParts.join("/");
  } catch {
    return null;
  }
};

export const deleteImageByUrl = async (url) => {
  ensureCloudinaryConfig();
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return { deleted: false, reason: "invalid_or_non_cloudinary_url" };

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  return { deleted: result.result === "ok", result: result.result, publicId };
};
