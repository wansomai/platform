// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { COOKIE_OPTIONS } from "@/lib/auth/constants";
import { generateTokens } from "@/lib/auth/token-service";
import { z } from "zod";

const prisma = new PrismaClient();

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

    // Prepare the user object for token generation
    const userForToken = {
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      role: user.role,
      organizationId: user.organizationId,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      }
    };

    // Generate tokens using our centralized service
    const { access_token, refresh_token } = generateTokens(userForToken);

    // Prepare user data for response (without sensitive data)
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      role: user.role,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      }
    };

    // Set cookies
    const cookieOptions = {
      ...COOKIE_OPTIONS,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60 // 7 days or 1 day
    };

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
        'Set-Cookie': `auth-token=${access_token}; Path=/; HttpOnly; Max-Age=3600; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}, refresh-token=${refresh_token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An error occurred during login", error: true },
      { status: 500 }
    );
  }
}