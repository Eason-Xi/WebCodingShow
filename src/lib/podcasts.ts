export function podcastPath(id: string) { return `/podcasts/${id}` }
export function formatDuration(seconds: number | null) {
  if (!seconds) return '时长未知'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60) % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}
export type AudioEpisode = { id: string; title: string; audioUrl: string; showTitle: string }
