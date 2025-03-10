// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare passwords
    // In a real app, you'd use a proper password hashing library like bcrypt
    // For this example, we'll assume the password is stored as plain text
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create a session token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
      process.env.JWT_SECRET || "your-fallback-secret",
      { expiresIn: "1d" }
    );

    // Set the token as a cookie and return response
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
    });

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}