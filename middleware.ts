import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isManagerRoute = req.nextUrl.pathname.startsWith('/manager');
    const isClientRoute = req.nextUrl.pathname.startsWith('/client');

    // Role-based access control
    if (isAdminRoute && token?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (isManagerRoute && !['super_admin', 'manager'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    if (isClientRoute && token?.role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/client/:path*',
    '/api/protected/:path*'
  ]
};