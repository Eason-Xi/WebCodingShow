'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('请输入管理员密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '登录验证失败')
      }

      router.push(from)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '登录异常，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[400px] rounded-panel border border-line bg-surface p-5 sm:p-8 shadow-panel">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-[14px] bg-brand text-brand-ink shadow-soft">
          <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={2} />
        </div>
        <h1 className="text-[21px] font-semibold text-ink">管理员登录</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-3">
          管理 WebCoding 平台作品、分类与展示配置
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-btn border border-red-200 bg-red-50 p-3.5 text-[12.5px] text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="admin-password"
            className="mb-2 block text-[12.5px] font-medium text-ink-2"
          >
            管理员访问密码
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"
              strokeWidth={2}
            />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码..."
              className="w-full rounded-btn border border-line-strong bg-subtle py-3 pl-10 pr-11 text-[13.5px] text-ink transition-colors duration-200 placeholder:text-ink-4 focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-chip text-ink-4 transition-colors duration-200 hover:bg-muted hover:text-ink-2"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11.5px] text-ink-4">
            <span>
              默认密码:{' '}
              <code className="rounded bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-ink-2">
                admin123
              </code>
            </span>
            <button
              type="button"
              onClick={() => setPassword('admin123')}
              className="font-medium text-ink-3 transition-colors duration-200 hover:text-ink"
            >
              一键填入
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-btn bg-brand px-4 py-3 text-[13.5px] font-medium text-brand-ink shadow-card transition-all duration-200 hover:bg-brand-hover active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <span>验证中...</span>
          ) : (
            <>
              <span>立即登入管理后台</span>
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 border-t border-line pt-6 text-center">
        <Link
          href="/"
          className="text-[12.5px] text-ink-3 transition-colors duration-200 hover:text-ink"
        >
          ← 返回作品集前台首页
        </Link>
      </div>
    </div>
  )
}
