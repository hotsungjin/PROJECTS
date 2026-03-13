import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// 인메모리 rate limit (Edge Runtime 호환)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 120, windowMs = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++
  return entry.count <= limit
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // API Rate Limiting
  if (pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'

    const isAuthRoute = pathname.startsWith('/api/v1/auth')
    const allowed = checkRateLimit(
      `${ip}:${isAuthRoute ? 'auth' : 'api'}`,
      isAuthRoute ? 10 : 120,
      60000
    )

    if (!allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    return NextResponse.next()
  }

  // auth 경로, 관리자 로그인은 항상 허용
  if (pathname.startsWith('/auth') || pathname === '/admin/login') {
    return NextResponse.next()
  }

  // admin, mypage 경로 → Supabase 세션 체크
  return await updateSession(request)
}

export const config = {
  matcher: ['/admin/:path*', '/mypage/:path*', '/api/:path*'],
}
