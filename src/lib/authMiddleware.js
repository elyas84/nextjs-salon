import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { requiredEnv } from "@/lib/env";

const JWT_SECRET = new TextEncoder().encode(requiredEnv("JWT_SECRET"));

export const authenticate = async (req) => {
  const token = req.cookies.get("token")?.value || null;
  const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: noStoreHeaders },
      ),
      user: null,
    };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { error: null, user: payload };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: noStoreHeaders },
      ),
      user: null,
    };
  }
};

export const getOptionalUser = async (req) => {
  const token = req.cookies.get("token")?.value || null;

  if (!token) {
    return { user: null };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { user: payload };
  } catch {
    return { user: null };
  }
};

export const requireAdmin = async (req) => {
  const { error, user } = await authenticate(req);
  if (error) return { error, user: null };

  if (user?.role !== "superadmin") {
    return {
      error: NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "Cache-Control": "no-store, max-age=0" } },
      ),
      user: null,
    };
  }

  return { error: null, user };
};
