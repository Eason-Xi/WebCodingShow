'use client'
import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { trackContent } from './ContentAnalytics'
import { Play, X, Headphones } from 'lucide-react'
import { podcastAudioSource, type AudioEpisode } from '@/lib/podcasts'

const AudioContext = createContext<{ track: AudioEpisode | null; play: (episode: AudioEpisode) => void }>({ track: null, play: () => {} })
export const usePodcast = () => useContext(AudioContext)
export function PodcastProvider({ children }: { children: ReactNode }) {
  const [track, setTrack] = useState<AudioEpisode | null>(null)
  const [error, setError] = useState('')
  const audio = useRef<HTMLAudioElement>(null)
  const speed = useRef(1)
  const playingEpisode = useRef<AudioEpisode | null>(null)
  const play = (episode: AudioEpisode) => {
    setError('')
    setTrack(episode)
    playingEpisode.current = episode
    const element = audio.current
    if (!element) return
    const source = podcastAudioSource(episode)
    if (element.getAttribute('src') !== source || element.error) { element.src = source; element.load() }
    void element.play().catch(error => {
      if (error?.name !== 'AbortError' && playingEpisode.current === episode) setError('未能开始播放，请点击下方播放按钮重试，或检查音频来源。')
    })
  }
  return <AudioContext.Provider value={{ track, play }}>
    {children}
    <div hidden={!track} className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-panel">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 sm:flex-nowrap">
        <Headphones className="hidden h-6 w-6 shrink-0 text-amber-600 sm:block" />
        <div className="min-w-0 flex-1 sm:max-w-xs"><p className="truncate text-[13px] font-semibold">{track?.title}</p><p className="text-xs text-ink-2">{track?.showTitle}</p></div>
        <button aria-label="关闭播客播放器" onClick={() => { audio.current?.pause(); setTrack(null); playingEpisode.current = null }} className="order-2 grid h-11 w-11 place-items-center rounded-btn hover:bg-subtle sm:order-4"><X className="h-4 w-4" /></button>
        <audio ref={audio} controls preload="none" aria-label="播客音频播放器" onLoadedMetadata={() => { if (audio.current) audio.current.playbackRate = speed.current }} onPlaying={() => { setError(''); const current = playingEpisode.current; if (current && audio.current?.getAttribute('src') === podcastAudioSource(current)) void trackContent('episode', current.id, 'play') }} onError={() => setError('音频加载失败，请检查网络或稍后重试。')} className="order-3 h-11 w-full sm:flex-1" />
        <label className="order-4 flex items-center gap-2 text-xs sm:order-3">倍速<select aria-label="播放速度" defaultValue="1" onChange={e => { speed.current = Number(e.target.value); if (audio.current) audio.current.playbackRate = speed.current }} className="min-h-11 rounded-btn bg-subtle px-2"><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label>
      </div>
      {error && <p role="alert" className="mx-auto mt-2 max-w-6xl text-xs text-red-600">{error}</p>}
    </div>
    {track && <div className="h-48 shrink-0 sm:h-24" aria-hidden />}
  </AudioContext.Provider>
}
export function PodcastPlayButton({ episode }: { episode: AudioEpisode }) {
  const { play } = usePodcast()
  return <button onClick={() => play(episode)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-5 text-sm font-medium text-brand-ink hover:bg-brand-hover"><Play className="h-4 w-4" />播放单集</button>
}
