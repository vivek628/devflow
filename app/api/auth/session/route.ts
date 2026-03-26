import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/get-session-user";

export async function GET() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      userId: sessionUser.userId,
      name: sessionUser.name,
      email: sessionUser.email,
    },
  });
}
