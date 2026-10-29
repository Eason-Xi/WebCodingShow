export function podcastPath(id: string) { return `/podcasts/${id}` }
export function podcastAudioSource(episode: Pick<AudioEpisode, 'id' | 'audioUrl'>) {
  // Muse's media redirect sends CORP: same-origin. Resolve it on our server so
  // the browser loads the cross-origin-enabled CDN directly, with a fresh URL.
  try {
    const url = new URL(episode.audioUrl)
    if (url.hostname === 'muse.ai' && url.pathname.startsWith('/podcasts/media/')) {
      return `/api/podcasts/episodes/${encodeURIComponent(episode.id)}/audio`
    }
  } catch { /* Invalid sources are reported by the audio element. */ }
  return episode.audioUrl
}
export function formatDuration(seconds: number | null) {
  if (!seconds) return '时长未知'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor(seconds / 60) % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` : `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}
export type AudioEpisode = { id: string; title: string; audioUrl: string; showTitle: string }
