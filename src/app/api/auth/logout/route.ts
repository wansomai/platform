// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Clear authentication cookies
    const response = NextResponse.json({ 
      status: 200,
      message: "Logged out successfully" 
    });
    
    // Clear cookies by setting them to expire immediately
    response.cookies.set('auth-token', '', { 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    response.cookies.set('refresh-token', '', { 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "An error occurred during logout", error: true },
      { status: 500 }
    );
  }
}