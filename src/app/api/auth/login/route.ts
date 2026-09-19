import { NextRequest, NextResponse } from 'next/server'
import { checkAdminPassword, setAdminSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (!password) {
      return NextResponse.json({ error: '请输入管理员密码' }, { status: 400 })
    }

    const isValid = await checkAdminPassword(password)
    if (!isValid) {
      return NextResponse.json({ error: '密码错误，请重试' }, { status: 401 })
    }

    await setAdminSessionCookie()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '登录服务异常' }, { status: 500 })
  }
}
