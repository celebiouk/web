import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateSession } from '@/lib/supabase/middleware';
import type { Database } from '@/types/supabase';

/**
 * Middleware for handling authentication and route protection
 * Runs on every request matching the config
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

  let supabaseResponse = NextResponse.next();
  let user: { id: string } | null = null;

  if (hasSupabaseEnv) {
    try {
      const sessionResult = await updateSession(request);
      supabaseResponse = sessionResult.supabaseResponse;
      user = sessionResult.user;
    } catch (error) {
      console.error('Middleware session update failed:', error);
    }
  } else {
    console.error('Middleware missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const { pathname } = request.nextUrl;

  // Custom domain routing: domain.com -> /username
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase();
  let appHost = 'cele.bio';
  try {
    appHost = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cele.bio').hostname.toLowerCase();
  } catch {
    appHost = 'cele.bio';
  }

  if (
    host &&
    host !== appHost &&
    host !== 'localhost' &&
    !host.endsWith('.vercel.app') &&
    pathname === '/'
  ) {
    const normalizedHost = host.startsWith('www.') ? host.slice(4) : host;

    try {
      if (!hasSupabaseEnv || !supabaseUrl || !supabaseAnonKey) {
        return supabaseResponse;
      }

      const supabase = createClient<Database>(
        supabaseUrl,
        supabaseAnonKey
      );

      const { data: profile } = await (supabase.from('profiles') as any)
        .select('username')
        .eq('custom_domain', normalizedHost)
        .eq('domain_verified', true)
        .maybeSingle();

      if (profile?.username) {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/${profile.username}`;
        return NextResponse.rewrite(rewriteUrl);
      }
    } catch (error) {
      console.error('Custom domain middleware error:', error);
    }
  }

  // Protected routes - require authentication
  const protectedRoutes = ['/dashboard', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth routes - redirect if already logged in
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard or onboarding if accessing auth routes while logged in
  if (isAuthRoute && user) {
    // Check if onboarding is completed (we'll fetch profile in the page)
    // For now, redirect to onboarding - the page will handle further routing
    return NextResponse.redirect(new URL('/onboarding/pick-template', request.url));
  }

  const referralCode = request.nextUrl.searchParams.get('ref');
  if (referralCode) {
    supabaseResponse.cookies.set('affiliate_ref', referralCode, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
