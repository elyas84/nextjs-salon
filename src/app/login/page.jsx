import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { requiredEnv } from "@/lib/env";
import LoginClient from "./LoginClient";

const JWT_SECRET = new TextEncoder().encode(requiredEnv("JWT_SECRET"));

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      redirect("/admin");
    } catch {
      // Invalid or expired token: continue rendering login page.
    }
  }

  return <LoginClient />;
}
