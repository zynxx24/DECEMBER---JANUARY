import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define role-based access rules
const RoleBasedAccess = {
  admin: ['/admin/page'], // Path for admin pages
  user: ['/users/page'],  // Path for user pages
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const roleCookie = request.cookies.get('role')?.value; // Retrieve role from cookie

  // Redirect to login if no role cookie is present
  if (!roleCookie) {
    url.pathname = '/components/login';
    return NextResponse.redirect(url);
  }

  // Get allowed paths for the role
  const allowedPaths = RoleBasedAccess[roleCookie as keyof typeof RoleBasedAccess] || [];

  // Check if the current path is authorized
  const isPathAllowed = allowedPaths.some((path) => url.pathname.startsWith(path));
  if (!isPathAllowed) {
    // Redirect unauthorized users to a 403 page
    url.pathname = '/404'; // Custom 403 error page
    return NextResponse.rewrite(url);
  }

  // Allow access to authorized users
  return NextResponse.next();
}

// Middleware configuration
export const config = {
  matcher: ['/admin/:path*', '/users/:path*'], // Apply middleware only to these paths
};
