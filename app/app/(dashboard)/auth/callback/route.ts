import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/login?error=missing_code', req.url));

  const result = await fetch(`${process.env.RELAY_URL}/auth/github/exchange?code=${code}&redirect_uri=${process.env.WEB_CALLBACK_URL}`);
  const data = await result.json();

  if (!data.token) return NextResponse.redirect(new URL('/login?error=auth_failed', req.url));

  const response = NextResponse.redirect(new URL('/dashboard', req.url));
  response.cookies.set('helix_token', data.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}