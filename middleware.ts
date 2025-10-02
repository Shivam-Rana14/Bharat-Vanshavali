import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Skip auth check for public routes and public API routes
  const publicRoutes = ['/login', '/register', '/', '/help', '/privacy', '/terms']
  const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/validate', '/api/auth/me']
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)
  const isPublicApiRoute = publicApiRoutes.includes(request.nextUrl.pathname)
  
  if (isPublicRoute || isPublicApiRoute) {
    // If user already authenticated, redirect them away from auth pages
    if (!isPublicApiRoute) {
      const token = request.cookies.get('auth-token')?.value
      if (token) {
        try {
          const payload = authService.verifyToken(token)
          const target = payload.type === 'admin' ? '/admin/dashboard' : '/citizen/dashboard'
          return NextResponse.redirect(new URL(target, request.url))
        } catch {}
      }
    }
    return NextResponse.next()
  }

  // Check for authentication token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Trust cookie presence; downstream API routes will verify
  const response = NextResponse.next()
  response.headers.set('x-has-auth', 'true')
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}