import { cookies } from 'next/headers'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'web-coding-platform-super-secret-key-2026'
const COOKIE_NAME = 'admin_session'

// 基于 Web Crypto 实现安全无外部臃肿依赖的 Token 签名与校验
async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(): Promise<string> {
  const payload = {
    role: 'admin',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天有效期
  }
  const payloadStr = JSON.stringify(payload)
  const encodedPayload = Buffer.from(payloadStr).toString('base64url')

  const key = await getKey()
  const enc = new TextEncoder()
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(encodedPayload))
  const signature = Buffer.from(signatureBuffer).toString('base64url')

  return `${encodedPayload}.${signature}`
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !token.includes('.')) return false
  const [encodedPayload, signature] = token.split('.')
  try {
    const key = await getKey()
    const enc = new TextEncoder()
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(signature, 'base64url'),
      enc.encode(encodedPayload)
    )
    if (!valid) return false

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'))
    if (payload.role === 'admin' && payload.exp > Date.now()) {
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  return password === ADMIN_PASSWORD
}

export async function setAdminSessionCookie(): Promise<void> {
  const token = await createSessionToken()
  const cookieStore = await cookies()
  // 仅在真实生产且非 localhost 情况下强制 Secure Cookie
  const isSecure = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production'
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return await verifySessionToken(token)
}
