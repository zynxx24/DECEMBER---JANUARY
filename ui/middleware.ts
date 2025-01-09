          // middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RoleBasedAccess } from './roles';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const roleCookie = request.cookies.get('Role')?.value;

  console.log(`[Middleware] Role: ${roleCookie}, Path: ${url.pathname}`);

  // Redirect to login if no role is found
  if (!roleCookie) {
    console.warn(`[Middleware] No role cookie found. Redirecting to login.`);
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Get allowed paths for the user's role
  const allowedPaths = RoleBasedAccess[roleCookie as keyof typeof RoleBasedAccess] || [];

  // Check if the requested path is allowed
  const isPathAllowed = allowedPaths.some((path) =>
    path.endsWith('*') // Handle wildcards
      ? url.pathname.startsWith(path.slice(0, -1))
      : url.pathname === path
  );

  if (!isPathAllowed) {
    console.error(`[Middleware] Unauthorized access attempt to ${url.pathname}`);
    url.pathname = '/404'; // Redirect to a "403 Forbidden" page
    return NextResponse.rewrite(url);
  }

  return NextResponse.next(); // Allow access
}

// Middleware configuration
export const config = {
  matcher: ['/admin/:path*', '/users/:path*', '/'], // Define applicable routes
};
