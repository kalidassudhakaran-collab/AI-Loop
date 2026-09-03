import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Intentionally pass-through.
 * next-auth/middleware (Edge) often fails to read Credentials JWT cookies on
 * Vercel, which bounces successful logins back to /login. Route protection
 * lives in app/(app)/layout.tsx and app/share/layout.tsx instead (Node runtime).
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/ask/:path*",
    "/settings/:path*",
    "/themes/:path*",
    "/reports/:path*",
    "/share/:path*",
  ],
};
