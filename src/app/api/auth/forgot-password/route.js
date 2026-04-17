import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { buildResetPasswordEmailHtml } from "@/lib/email-templates/reset-password-email";
import { sendEmail } from "@/lib/mailer";
import { getPublicAppBaseUrl } from "@/lib/public-app-url";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).select(
      "+resetPasswordTokenHash +resetPasswordExpiresAt",
    );

    if (!user) {
      return NextResponse.json(
        { message: "If this email exists, a reset link has been sent." },
        { status: 200 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    const resetUrl = `${getPublicAppBaseUrl()}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "FixPro — reset your password",
      html: buildResetPasswordEmailHtml({
        resetUrl,
        userEmail: user.email,
      }),
    });

    return NextResponse.json(
      { message: "If this email exists, a reset link has been sent." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
