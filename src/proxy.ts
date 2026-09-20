import { NextResponse, type NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next()
  if (!(await verifySessionToken(request.cookies.get('admin_session')?.value))) {
    const url = new URL('/admin/login', request.url)
    url.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
