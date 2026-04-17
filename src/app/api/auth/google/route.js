import { NextResponse } from "next/server";
import {
  buildGoogleAuthorizeUrl,
  createOAuthState,
  getGoogleRedirectUri,
  getOAuthBaseUrl,
  isGoogleOAuthConfigured,
} from "@/lib/google-oauth";

const STATE_COOKIE = "google_oauth_state";

export async function GET(req) {
  if (!isGoogleOAuthConfigured()) {
    const base = getOAuthBaseUrl(req);
    return NextResponse.redirect(
      `${base}/login?error=google_config`,
      { status: 302 },
    );
  }

  const state = createOAuthState();
  const redirectUri = getGoogleRedirectUri(req);
  const url = buildGoogleAuthorizeUrl({
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri,
    state,
  });

  const response = NextResponse.redirect(url, { status: 302 });
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
