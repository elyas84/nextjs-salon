import { SignJWT } from "jose";
import { requiredEnv } from "@/lib/env";

const JWT_SECRET = new TextEncoder().encode(requiredEnv("JWT_SECRET"));
const JWT_EXPIRES_IN = "1h";

export const signToken = async (payload) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRES_IN)
    .setIssuedAt()
    .sign(JWT_SECRET);
};
