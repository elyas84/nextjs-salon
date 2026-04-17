import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/jwt";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUserInfo,
  getGoogleRedirectUri,
  getOAuthBaseUrl,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";

const STATE_COOKIE = "google_oauth_state";

function redirectWithError(req, code) {
  const base = getOAuthBaseUrl(req);
  return NextResponse.redirect(`${base}/login?error=${code}`, { status: 302 });
}

export async function GET(req) {
  if (!isGoogleOAuthConfigured()) {
    return redirectWithError(req, "google_config");
  }

  const { searchParams } = new URL(req.url);
  const error = searchParams.get("error");
  if (error === "access_denied") {
    return redirectWithError(req, "google_denied");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const stored = req.cookies.get(STATE_COOKIE)?.value;

  const clearState = (res) => {
    res.cookies.set(STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return res;
  };

  if (!code || !state || !stored || state !== stored) {
    const res = redirectWithError(req, "google_state");
    return clearState(res);
  }

  const redirectUri = getGoogleRedirectUri(req);
  const tokenPayload = await exchangeGoogleAuthorizationCode(code, redirectUri);
  if (!tokenPayload?.access_token) {
    const res = redirectWithError(req, "google_token");
    return clearState(res);
  }

  const profile = await fetchGoogleUserInfo(tokenPayload.access_token);
  if (!profile?.id || !profile?.email) {
    const res = redirectWithError(req, "google_profile");
    return clearState(res);
  }

  const googleId = String(profile.id);
  const email = String(profile.email).toLowerCase().trim();
  const name =
    String(profile.name || "").trim() ||
    email.split("@")[0] ||
    "Google user";

  if (!profile.verified_email) {
    const res = redirectWithError(req, "google_email_unverified");
    return clearState(res);
  }

  try {
    await connectDB();

    let user = await User.findOne({ googleId });
    if (!user) {
      const byEmail = await User.findOne({ email });
      if (byEmail) {
        if (byEmail.googleId && byEmail.googleId !== googleId) {
          const res = redirectWithError(req, "google_account_mismatch");
          return clearState(res);
        }
        byEmail.googleId = googleId;
        if (!byEmail.name?.trim()) byEmail.name = name;
        await byEmail.save();
        user = byEmail;
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          role: "client",
        });
      }
    }

    if (!user.isActive) {
      const res = redirectWithError(req, "google_inactive");
      return clearState(res);
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const jwt = await signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      clientId: user.client ? user.client.toString() : null,
    });

    const base = getOAuthBaseUrl(req);
    const destination =
      user.role === "superadmin" ? `${base}/admin` : `${base}/dashboard`;

    const response = NextResponse.redirect(destination, { status: 302 });
    response.cookies.set("token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });
    clearState(response);
    return response;
  } catch (err) {
    console.error("Google callback error:", err);
    const res = redirectWithError(req, "google_server");
    return clearState(res);
  }
}
