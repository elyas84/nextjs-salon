import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/authMiddleware";
import User from "@/lib/models/User";

export async function PATCH(req) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const updates = {};

    if (typeof body.name === "string") {
      updates.name = body.name.trim();
    }

    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const exists = await User.findOne({
        _id: { $ne: authUser.id },
        email,
      }).select("_id");

      if (exists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }

      updates.email = email;
    }

    let userWithPassword;
    if (body.currentPassword && body.newPassword) {
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 },
        );
      }

      // Verify current password
      userWithPassword = await User.findById(authUser.id).select("+password");
      if (!userWithPassword) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isValid = await userWithPassword.comparePassword(body.currentPassword);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      userWithPassword.password = body.newPassword;
    }

    let user;
    if (userWithPassword) {
      if (updates.name) userWithPassword.name = updates.name;
      if (updates.email) userWithPassword.email = updates.email;
      await userWithPassword.save();
      user = userWithPassword;
    } else {
      user = await User.findByIdAndUpdate(authUser.id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Profile updated",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req) {
  const { error, user: authUser } = await authenticate(req);
  if (error) return error;

  try {
    await connectDB();

    const deleted = await User.findByIdAndDelete(authUser.id);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response = NextResponse.json(
      { message: "Account deleted" },
      { status: 200 },
    );

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Delete profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
