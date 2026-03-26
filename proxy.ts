import { NextRequest, NextResponse } from "next/server";

import { authCookie, verifySessionToken } from "@/lib/auth/session";

const protectedRoutes = ["/dashboard", "/projects"];
const authRoutes = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(authCookie.name)?.value;
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!token) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  try {
    await verifySessionToken(token);

    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));

    response.cookies.set({
      name: authCookie.name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/projects/:path*", "/login", "/signup"],
};
