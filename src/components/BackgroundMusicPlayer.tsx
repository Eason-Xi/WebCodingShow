'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Minimize2,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { MusicSettingsPayload } from '@/lib/music'

const STORAGE_KEY = 'webcoding-music-player-v1'
const AUTO_HIDE_DELAY = 6000

type StoredPreference = {
  trackId?: string
  volume?: number
}

type PlayResult = 'started' | 'blocked' | 'failed'

const subscribeToHydration = () => () => undefined

function readPreference(settings: MusicSettingsPayload): Required<StoredPreference> {
  const fallback = {
    trackId: settings.defaultTrackId ?? settings.tracks[0]?.id ?? '',
    volume: settings.defaultVolume / 100,
  }
  if (typeof window === 'undefined') return fallback

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as StoredPreference
    return {
      trackId: stored.trackId && settings.tracks.some((track) => track.id === stored.trackId)
        ? stored.trackId
        : fallback.trackId,
      volume: typeof stored.volume === 'number' && stored.volume >= 0 && stored.volume <= 1
        ? stored.volume
        : fallback.volume,
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return fallback
  }
}

export function BackgroundMusicPlayer({ settings }: { settings: MusicSettingsPayload }) {
  const pathname = usePathname()
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false)
  const initialPreference = useMemo(() => readPreference(settings), [settings])
  const audioRef = useRef<HTMLAudioElement>(null)
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPlay = useRef(settings.autoplay)
  const lastAudibleVolume = useRef(Math.max(initialPreference.volume, 0.1))
  const [trackId, setTrackId] = useState(initialPreference.trackId)
  const [volume, setVolume] = useState(initialPreference.volume)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [playlistOpen, setPlaylistOpen] = useState(false)

  const currentIndex = useMemo(() => {
    const index = settings.tracks.findIndex((track) => track.id === trackId)
    return index >= 0 ? index : 0
  }, [settings.tracks, trackId])
  const currentTrack = settings.tracks[currentIndex]
  const currentTrackId = currentTrack?.id
  const playerAvailable = hydrated && !pathname.startsWith('/admin') && settings.enabled && Boolean(currentTrack)

  const play = useCallback(async (): Promise<PlayResult> => {
    const audio = audioRef.current
    if (!audio) return 'failed'

    try {
      await audio.play()
      pendingPlay.current = false
      return 'started'
    } catch (error) {
      setIsPlaying(false)
      const blocked = error instanceof DOMException && error.name === 'NotAllowedError'
      if (!blocked) pendingPlay.current = false
      return blocked ? 'blocked' : 'failed'
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const clearAutoHide = useCallback(() => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current)
      autoHideTimer.current = null
    }
  }, [])

  const scheduleAutoHide = useCallback(() => {
    clearAutoHide()
    autoHideTimer.current = setTimeout(() => {
      setPlaylistOpen(false)
      setIsExpanded(false)
    }, AUTO_HIDE_DELAY)
  }, [clearAutoHide])

  useEffect(() => {
    if (playerAvailable && isExpanded && !playlistOpen) scheduleAutoHide()
    else clearAutoHide()

    return clearAutoHide
  }, [clearAutoHide, isExpanded, playerAvailable, playlistOpen, scheduleAutoHide])

  useEffect(() => {
    if (!playerAvailable || !currentTrackId) return

    let disposed = false
    let waitingForGesture = false
    const pause = () => audioRef.current?.pause()
    const removeAutoplayUnlock = () => {
      if (!waitingForGesture) return
      waitingForGesture = false
      document.removeEventListener('pointerdown', unlockAutoplay, true)
      document.removeEventListener('keydown', unlockAutoplay, true)
    }
    const unlockAutoplay = () => {
      removeAutoplayUnlock()
      if (document.visibilityState === 'visible') void play()
    }
    const waitForFirstGesture = () => {
      if (disposed || waitingForGesture) return
      waitingForGesture = true
      document.addEventListener('pointerdown', unlockAutoplay, { capture: true, once: true, passive: true })
      document.addEventListener('keydown', unlockAutoplay, { capture: true, once: true })
    }
    const autoplayIfVisible = async () => {
      if (!settings.autoplay || document.visibilityState !== 'visible') return
      pendingPlay.current = true
      const result = await play()
      if (!disposed && result === 'blocked') waitForFirstGesture()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') pause()
      else void autoplayIfVisible()
    }
    const handlePageShow = () => void autoplayIfVisible()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', pause)
    window.addEventListener('focus', handlePageShow)
    window.addEventListener('pagehide', pause)
    window.addEventListener('pageshow', handlePageShow)
    void autoplayIfVisible()

    return () => {
      disposed = true
      removeAutoplayUnlock()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', pause)
      window.removeEventListener('focus', handlePageShow)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', handlePageShow)
      pause()
    }
  }, [currentTrackId, play, playerAvailable, settings.autoplay])

  if (!playerAvailable || !currentTrack) return null

  const savePreference = (nextTrackId = trackId, nextVolume = volume) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trackId: nextTrackId, volume: nextVolume }))
  }

  const selectTrack = (nextTrackId: string, shouldPlay = true) => {
    pendingPlay.current = shouldPlay || isPlaying
    setTrackId(nextTrackId)
    savePreference(nextTrackId)
  }

  const moveTrack = (direction: -1 | 1) => {
    const nextIndex = (currentIndex + direction + settings.tracks.length) % settings.tracks.length
    selectTrack(settings.tracks[nextIndex].id)
  }

  const handleVolume = (nextVolume: number) => {
    setVolume(nextVolume)
    if (nextVolume > 0) lastAudibleVolume.current = nextVolume
    savePreference(trackId, nextVolume)
  }

  const handleEnded = () => {
    const hasNext = currentIndex < settings.tracks.length - 1
    if (hasNext) {
      selectTrack(settings.tracks[currentIndex + 1].id)
    } else if (settings.loopPlaylist) {
      if (settings.tracks.length === 1 && audioRef.current) {
        audioRef.current.currentTime = 0
        void play()
      } else {
        selectTrack(settings.tracks[0].id)
      }
    } else {
      setIsPlaying(false)
    }
  }

  return (
    <div
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 transition-[width] duration-300 motion-reduce:transition-none ${
        isExpanded ? 'w-[min(280px,calc(100vw-2rem))]' : 'w-20'
      }`}
      onPointerEnter={clearAutoHide}
      onPointerLeave={() => {
        if (isExpanded && !playlistOpen) scheduleAutoHide()
      }}
      onPointerUp={() => {
        if (isExpanded && !playlistOpen) scheduleAutoHide()
      }}
      onFocusCapture={clearAutoHide}
      onBlurCapture={() => {
        if (isExpanded && !playlistOpen) scheduleAutoHide()
      }}
    >
      <audio
        ref={audioRef}
        src={currentTrack.url}
        preload="metadata"
        autoPlay={settings.autoplay}
        onLoadedMetadata={() => {
          if (audioRef.current) audioRef.current.volume = volume
        }}
        onCanPlay={() => {
          if (pendingPlay.current) {
            void play()
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
      />

      {!isExpanded ? (
        <div className="flex h-12 items-center gap-0.5 rounded-2xl border border-white/10 bg-[#18181d]/95 p-1 text-white shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={() => (isPlaying ? audioRef.current?.pause() : void play())}
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-300 text-[#282117] transition-transform hover:scale-[1.03] active:scale-95 motion-reduce:transition-none"
            aria-label={isPlaying ? '暂停背景音乐' : '播放背景音乐'}
            title={`${isPlaying ? '暂停' : '播放'}：${currentTrack.title}`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="grid h-10 w-7 shrink-0 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/8 hover:text-white"
            aria-label={`展开背景音乐播放器，当前曲目：${currentTrack.title}`}
            title="展开播放器"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <>
          {playlistOpen ? (
            <div className="mb-2 max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#18181d]/95 p-2 text-white shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between px-2 pb-2 pt-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  选择背景音乐
                </span>
                <span className="text-[11px] tabular-nums text-white/35">
                  {settings.tracks.length} 首
                </span>
              </div>
              <div className="space-y-1">
                {settings.tracks.map((track, index) => {
                  const active = track.id === currentTrack.id
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => {
                        selectTrack(track.id)
                        setPlaylistOpen(false)
                      }}
                      aria-current={active ? 'true' : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                        active
                          ? 'bg-white/12 text-white'
                          : 'text-white/65 hover:bg-white/7 hover:text-white'
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] tabular-nums ${active ? 'bg-white text-[#18181d]' : 'bg-white/7 text-white/40'}`}
                      >
                        {active && isPlaying ? <Music2 className="h-3.5 w-3.5" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{track.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-white/40">
                          {track.artist || '未知艺术家'}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-2 flex items-center gap-1 border-t border-white/10 px-1 pt-2">
                <button
                  type="button"
                  onClick={() => moveTrack(-1)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                  aria-label="上一首"
                >
                  <SkipBack className="h-3.5 w-3.5" fill="currentColor" />
                </button>
                <button
                  type="button"
                  onClick={() => handleVolume(volume > 0 ? 0 : lastAudibleVolume.current)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/55 hover:bg-white/8 hover:text-white"
                  aria-label={volume > 0 ? '静音' : '恢复音量'}
                >
                  {volume > 0 ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <VolumeX className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(event) => handleVolume(Number(event.target.value))}
                  className="h-11 min-w-0 flex-1 cursor-pointer accent-amber-300"
                  aria-label={`音量 ${Math.round(volume * 100)}%`}
                />
                <button
                  type="button"
                  onClick={() => moveTrack(1)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                  aria-label="下一首"
                >
                  <SkipForward className="h-3.5 w-3.5" fill="currentColor" />
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#18181d]/95 p-1.5 text-white shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setPlaylistOpen((open) => !open)}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 text-left transition-colors hover:bg-white/7"
              aria-expanded={playlistOpen}
              aria-label={`${playlistOpen ? '收起' : '展开'}背景音乐歌单`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-amber-300 text-[#282117]">
                <Music2
                  className={`h-3.5 w-3.5 ${isPlaying ? 'animate-pulse motion-reduce:animate-none' : ''}`}
                  strokeWidth={2.2}
                />
              </span>
              <span className="min-w-0 flex-1" aria-live="polite">
                <span className="block truncate text-xs font-medium">{currentTrack.title}</span>
              </span>
              {playlistOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/35" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5 shrink-0 text-white/35" />
              )}
            </button>

            <button
              type="button"
              onClick={() => (isPlaying ? audioRef.current?.pause() : void play())}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-[#18181d] transition-transform hover:scale-[1.03] active:scale-95 motion-reduce:transition-none"
              aria-label={isPlaying ? '暂停背景音乐' : '播放背景音乐'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaylistOpen(false)
                setIsExpanded(false)
              }}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white/45 transition-colors hover:bg-white/8 hover:text-white"
              aria-label="收起背景音乐播放器"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
