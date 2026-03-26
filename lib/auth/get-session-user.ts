import { cookies } from "next/headers";

import { authCookie, verifySessionToken } from "@/lib/auth/session";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookie.name)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
