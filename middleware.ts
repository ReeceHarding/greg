/*
<ai_context>
Contains middleware for protecting routes, checking user authentication, and redirecting as needed.
Uses Firebase Auth for authentication instead of Clerk.
</ai_context>
*/

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-config'

// Define protected routes
const protectedRoutes = ['/dashboard', '/api/protected', '/admin']
const adminOnlyRoutes = ['/admin', '/api/admin']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  console.log('[Middleware] Processing request for:', request.nextUrl.pathname)
  
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')?.value
  
  console.log('[Middleware] Session cookie present:', !!sessionCookie)
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  console.log('[Middleware] Is protected route:', isProtectedRoute)
  console.log('[Middleware] Is admin route:', isAdminRoute)
  console.log('[Middleware] Is auth route:', isAuthRoute)
  
  // If it's a protected route and no session, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    console.log('[Middleware] No session for protected route, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If it's an auth route and has session, redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    console.log('[Middleware] Session exists for auth route, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Check admin role for admin routes
  if (isAdminRoute && sessionCookie) {
    try {
      // Only verify admin role if adminAuth is available
      if (adminAuth) {
        console.log('[Middleware] Verifying admin role for route:', pathname)
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
        const role = decodedClaims.role as string | undefined
        
        console.log('[Middleware] User role:', role)
        
        if (role !== 'admin') {
          console.log('[Middleware] Non-admin user trying to access admin route, redirecting to dashboard')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } else {
        console.warn('[Middleware] Firebase Admin Auth not available, skipping admin check')
      }
    } catch (error) {
      console.error('[Middleware] Error verifying admin role:', error)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  console.log('[Middleware] Allowing request to continue')
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
}
