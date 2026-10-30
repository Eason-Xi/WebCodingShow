// A single HTTP byte range is sufficient for browser video playback and seeking.
export function parseMediaRange(value: string | null, size: number): { start: number; end: number } | 'invalid' | null {
  if (!value) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(value)
  if (!match || (!match[1] && !match[2])) return 'invalid'
  const suffix = !match[1]
  const start = suffix ? Math.max(0, size - Number(match[2])) : Number(match[1])
  const end = suffix || !match[2] ? size - 1 : Math.min(size - 1, Number(match[2]))
  return Number.isSafeInteger(start) && Number.isSafeInteger(end) && start >= 0 && start <= end && start < size ? { start, end } : 'invalid'
}
