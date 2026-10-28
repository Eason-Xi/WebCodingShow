'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function AnalyticsRefresh() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return <button disabled={pending} onClick={() => startTransition(() => router.refresh())} className="min-h-11 rounded-btn border border-line px-4 text-xs text-ink-2 hover:bg-subtle disabled:opacity-50">{pending ? '刷新中…' : '刷新统计'}</button>
}
