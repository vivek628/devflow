import { JWTPayload, SignJWT, jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "devflow_token";
const SESSION_DURATION_IN_SECONDS = 60 * 60 * 24 * 7;
const DEVELOPMENT_JWT_SECRET = "devflow-dev-jwt-secret-change-me";

type SessionPayload = JWTPayload & {
  userId: string;
  email: string;
  name: string;
};

function getJwtSecret() {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "development" ? DEVELOPMENT_JWT_SECRET : undefined);

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: {
  userId: string;
  email: string;
  name: string;
}) {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_IN_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return payload as SessionPayload;
}

export const authCookie = {
  name: AUTH_COOKIE_NAME,
  maxAge: SESSION_DURATION_IN_SECONDS,
};
