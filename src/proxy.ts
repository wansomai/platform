// proxy.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  
  // Get the token, using the same secret used in NextAuth
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // If token exists, allow the request
  if (token) {
    return NextResponse.next();
  }
  
  // If it's an API route, return a 401 response
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(
      { message: 'Authentication required', error: true },
      { status: 401 }
    );
  }
  
  // Redirect to login with callback URL
  const url = new URL('/login', request.url);
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  
  return NextResponse.redirect(url);
}

// Match all routes except those that start with:
// - api/auth (NextAuth API routes)
// - login, register (auth-related pages)
// - _next, public (Next.js internals & static files)
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/api/projects/:path*',
    '/api/projects',
  ],
}