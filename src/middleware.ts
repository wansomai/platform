import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyToken } from '@/lib/auth'

// Paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/terms',
  '/privacy'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check if the path is an API route
  if (pathname.startsWith('/api/')) {
    // For API routes, check Authorization header
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    
    try {
      // Verify and decode the token
      const decoded = verifyToken(token)
      
      // Add user ID to request headers for use in API routes
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', decoded.userId)
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  
  // For non-API routes, check session cookie
  try {
    const session = await getToken({ req: request })
    
    // If no session, redirect to login
    if (!session) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  } catch (error) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
}
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. /_vercel (Vercel internals)
     * 4. /favicon.ico, /robots.txt (static files)
     */
    '/((?!_next|_static|_vercel|favicon.ico|robots.txt).*)',
  ],
}