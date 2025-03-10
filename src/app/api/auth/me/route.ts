// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    // Get the token from request cookies
    const authToken = request.cookies.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify the token
    const payload = jwt.verify(
      authToken,
      process.env.JWT_SECRET || "your-fallback-secret"
    );

    // Return the user info from the token
    return NextResponse.json({ user: payload });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}