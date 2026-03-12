// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import authOptions from "@/lib/auth/auth-options";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

// Wrap with a fallback so Turbopack's first-compile cycle never returns HTML
async function safeHandler(req: NextRequest, ctx: any) {
  try {
    return await handler(req, ctx);
  } catch (err) {
    console.error("[NextAuth] handler error:", err);
    return new Response(JSON.stringify({ error: "Internal auth error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export { safeHandler as GET, safeHandler as POST };