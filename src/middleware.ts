import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { UserRole } from '@prisma/client';

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const userRole = session?.user?.role as UserRole | undefined;

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = nextUrl.pathname === '/' || nextUrl.pathname === '/login';

  // Allow API authentication routes and public routes to pass through
  if (isApiAuthRoute || isPublicRoute) {
    // If user is logged in and tries to access login page, redirect them
    if (session && nextUrl.pathname === '/login') {
      const redirectUrl = userRole === 'ADMIN' ? '/admin/dashboard' : '/officer';
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }
    return NextResponse.next();
  }

  // If there's no session, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Role-based access control
  if (nextUrl.pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN') {
      // Redirect non-admins away from admin routes
      return NextResponse.redirect(new URL('/officer', nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith('/officer')) {
    if (userRole !== 'OFFICER') {
      // Redirect non-officers away from officer routes
      return NextResponse.redirect(new URL('/admin/dashboard', nextUrl));
    }
  }

  // Allow the request to proceed if none of the above conditions are met
  return NextResponse.next();
});

// Match all routes except static assets and Next.js internal routes
export const config = {
  matcher: ['/((?!api/genkit|api/setup|_next/static|_next/image|favicon.ico).*)'],
};
