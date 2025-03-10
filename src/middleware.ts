// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // TEMPORARILY BYPASSING ALL AUTHENTICATION CHECKS
  // Simply allow all requests to proceed
  return NextResponse.next();
}

// Specify which routes the middleware should run on
export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*", 
    "/projects/:path*", 
    "/api/projects/:path*",
    "/api/projects"
  ],
};