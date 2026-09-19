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
    <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          管理员登录
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          管理 WebCoding 平台作品、分类与展示配置
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            管理员访问密码
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            默认初始密码为 <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 font-mono">admin123</code>（可在 .env 中修改）
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>验证中...</span>
          ) : (
            <>
              <span>立即登入管理后台</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 text-center">
        <Link
          href="/"
          className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          ← 返回作品集前台首页
        </Link>
      </div>
    </div>
  )
}
