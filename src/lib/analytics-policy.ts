export const ANALYTICS_WINDOW_MS = 30 * 60 * 1000
export type ContentType = 'project' | 'post' | 'episode'
export type AnalyticsEvent = 'view' | 'play' | 'videoClick' | 'experienceClick'
export type AnalyticsInput = { contentType: ContentType; contentId: string; event: AnalyticsEvent; visitorId: string }

export function parseAnalyticsInput(value: unknown): AnalyticsInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { contentType, contentId, event, visitorId } = value as Record<string, unknown>
  if (typeof contentType !== 'string' || !['project', 'post', 'episode'].includes(contentType) ||
    typeof contentId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(contentId) ||
    typeof visitorId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) return null
  const allowed = contentType === 'project' ? ['view', 'videoClick', 'experienceClick'] : contentType === 'episode' ? ['view', 'play'] : ['view']
  if (typeof event !== 'string' || !allowed.includes(event)) return null
  return { contentType, contentId, event, visitorId } as AnalyticsInput
}

// Taiwan has a fixed UTC+8 offset; ISO day keys sort chronologically in both databases.
export function analyticsDay(date = new Date()): string {
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function analyticsDays(now = new Date(), count = 7): string[] {
  return Array.from({ length: count }, (_, i) => analyticsDay(new Date(now.getTime() - (count - 1 - i) * 86400000)))
}

export function isAnalyticsBot(userAgent: string): boolean {
  return /bot\b|crawler|spider|headless|preview|facebookexternalhit|lighthouse/i.test(userAgent)
}

export function isAnalyticsOrigin(headers: Headers): boolean {
  try {
    const origin = headers.get('origin') || ''
    const source = new URL(origin)
    // Next's internal URL can use a different development hostname. The browser's
    // Origin must match the incoming Host, including its port, without a path.
    return ['http:', 'https:'].includes(source.protocol) && source.origin === origin &&
      source.host === headers.get('host') && headers.get('sec-fetch-site') !== 'cross-site'
  } catch { return false }
}
