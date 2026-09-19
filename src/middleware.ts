import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'web-coding-platform-super-secret-key-2026'
const COOKIE_NAME = 'admin_session'

async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes('.')) return false
  const [encodedPayload, signature] = token.split('.')
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    // Base64URL 转 Uint8Array
    const base64 = signature.replace(/-/g, '+').replace(/_/g, '/')
    const binString = atob(base64)
    const sigBytes = Uint8Array.from(binString, (m) => m.charCodeAt(0))

    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes,
      enc.encode(encodedPayload)
    )
    if (!valid) return false

    const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(payloadJson)
    return payload.role === 'admin' && payload.exp > Date.now()
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 保护 /admin/*，但排除 /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const isValid = await verifyToken(token)

    if (!isValid) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
