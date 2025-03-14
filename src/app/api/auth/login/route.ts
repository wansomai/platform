// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

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

    // Create tokens
    const access_token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    const refresh_token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
        },
      },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Prepare user data for response
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
      }
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