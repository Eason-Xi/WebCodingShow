'use client'

import { useEffect, type ComponentProps } from 'react'
import { ANALYTICS_WINDOW_MS, type AnalyticsEvent, type ContentType } from '@/lib/analytics-policy'

let fallbackVisitor: string | undefined
const sent = new Map<string, number>()
const pending = new Set<string>()

function visitorId() {
  fallbackVisitor ??= crypto.randomUUID()
  try {
    const saved = localStorage.getItem('content-analytics-visitor')
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved
    localStorage.setItem('content-analytics-visitor', fallbackVisitor)
  } catch { /* Private browsing/storage restrictions: deduplicate within this page session. */ }
  return fallbackVisitor
}

export async function trackContent(contentType: ContentType, contentId: string, event: AnalyticsEvent) {
  const key = `${contentType}:${contentId}:${event}`
  if (pending.has(key) || Date.now() - (sent.get(key) ?? 0) < ANALYTICS_WINDOW_MS) return
  pending.add(key)
  try {
    const response = await fetch('/api/analytics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', keepalive: true,
      body: JSON.stringify({ contentType, contentId, event, visitorId: visitorId() }),
    })
    if (response.ok) sent.set(key, Date.now())
  } catch { /* Analytics must never interrupt reading, navigation or playback. */ }
  finally { pending.delete(key) }
}

export function ContentView({ contentType, contentId }: { contentType: ContentType; contentId: string }) {
  useEffect(() => {
    const report = () => { if (document.visibilityState === 'visible') void trackContent(contentType, contentId, 'view') }
    report()
    document.addEventListener('visibilitychange', report)
    return () => document.removeEventListener('visibilitychange', report)
  }, [contentType, contentId])
  return null
}

export function TrackedProjectLink({ contentId, event, ...props }: Omit<ComponentProps<'a'>, 'onClick' | 'onAuxClick'> & { contentId: string; event: 'videoClick' | 'experienceClick' }) {
  return <a {...props} onClick={() => void trackContent('project', contentId, event)} onAuxClick={e => { if (e.button === 1) void trackContent('project', contentId, event) }} />
}
