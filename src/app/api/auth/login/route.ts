// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/auth/token-service";
import { prepareUserForToken, prepareUserResponse, generateAuthCookieHeader } from "@/lib/auth/auth-utils";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required", error: true },
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
        { message: "Invalid credentials", error: true },
        { status: 401 }
      );
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials", error: true },
        { status: 401 }
      );
    }

    // Prepare user data using shared utilities
    const userForToken = prepareUserForToken(user);
    const { access_token, refresh_token } = generateTokens(userForToken);
    const userData = prepareUserResponse(user);

    // Create the response with the exact structure expected by the client
    return NextResponse.json({
      status: 200,
      message: "Login successful",
      data: {
        access_token,
        refresh_token,
        user: userData
      }
    }, {
      status: 200,
      headers: {
        'Set-Cookie': generateAuthCookieHeader(access_token, refresh_token)
      }
    });
  } catch (error) {
    
    return NextResponse.json(
      { message: "An error occurred during login", error: true },
      { status: 500 }
    );
  }
}