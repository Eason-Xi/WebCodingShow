'use client'

import { useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  GripVertical,
  Music2,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  MAX_AUDIO_BYTES,
  MAX_MUSIC_TRACKS,
  type MusicSettingsPayload,
  type MusicTrack,
} from '@/lib/music'

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-line-strong'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function createTrack(): MusicTrack {
  return { id: crypto.randomUUID(), title: '', artist: '', url: '' }
}

export function MusicSettingsForm({ initialSettings }: { initialSettings: MusicSettingsPayload }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateTrack = (id: string, patch: Partial<MusicTrack>) => {
    setSettings((current) => ({
      ...current,
      tracks: current.tracks.map((track) => track.id === id ? { ...track, ...patch } : track),
    }))
  }

  const addTrack = (track = createTrack()) => {
    setError('')
    if (settings.tracks.length >= MAX_MUSIC_TRACKS) {
      setError(`歌单最多可保存 ${MAX_MUSIC_TRACKS} 首歌曲`)
      return
    }
    setSettings((current) => ({
      ...current,
      tracks: [...current.tracks, track],
      defaultTrackId: current.defaultTrackId ?? track.id,
    }))
  }

  const removeTrack = (id: string) => {
    setSettings((current) => {
      const tracks = current.tracks.filter((track) => track.id !== id)
      return {
        ...current,
        tracks,
        defaultTrackId: current.defaultTrackId === id ? tracks[0]?.id ?? null : current.defaultTrackId,
      }
    })
  }

  const moveTrack = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= settings.tracks.length) return
    setSettings((current) => {
      const tracks = [...current.tracks]
      ;[tracks[index], tracks[target]] = [tracks[target], tracks[index]]
      return { ...current, tracks }
    })
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size === 0 || file.size > MAX_AUDIO_BYTES || !['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/ogg'].includes(file.type)) {
      setError('请上传 25 MB 以内的 MP3、M4A、WAV 或 OGG 音频')
      return
    }

    setUploading(true)
    setError('')
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/music/upload', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '音频上传失败')
      addTrack({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, '').slice(0, 100),
        artist: '',
        url: data.url,
      })
      setMessage('音频已上传并加入歌单，请检查歌曲信息后保存设置。')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '音频上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/music', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '保存音乐设置失败')
      setSettings(data)
      setMessage('音乐设置已保存，刷新前台页面即可看到最新歌单。')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存音乐设置失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="w-full max-w-5xl p-4 sm:p-6 xl:p-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-600">
            <Music2 className="h-3.5 w-3.5" />
            <span>Background Music</span>
          </div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">背景音乐</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-3">
            管理前台歌单、默认歌曲与播放方式。访客仍可在播放器中自行选歌和调整音量。
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn border border-line-strong bg-surface px-4 text-[13px] font-medium text-ink-2 hover:bg-subtle"
        >
          <span>打开前台试听</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {error ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-card border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {message ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="mb-6 rounded-card border border-line bg-surface p-4 shadow-soft sm:p-6">
        <h2 className="text-[15px] font-semibold text-ink">播放设置</h2>
        <div className="mt-4 divide-y divide-line">
          <div className="flex items-center justify-between gap-5 py-4 first:pt-0">
            <div>
              <p className="text-[13.5px] font-medium text-ink">在前台显示音乐播放器</p>
              <p className="mt-1 text-xs leading-5 text-ink-3">关闭后歌单仍会保存，但访客不会看到播放器。</p>
            </div>
            <Switch checked={settings.enabled} onChange={(enabled) => setSettings({ ...settings, enabled })} label="前台音乐播放器" />
          </div>
          <div className="flex items-center justify-between gap-5 py-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">进入页面后尝试自动播放</p>
              <p className="mt-1 text-xs leading-5 text-ink-3">手机和现代浏览器可能拦截带声音的自动播放，访客可点击播放按钮继续。</p>
            </div>
            <Switch checked={settings.autoplay} onChange={(autoplay) => setSettings({ ...settings, autoplay })} label="自动播放" />
          </div>
          <div className="flex items-center justify-between gap-5 py-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">循环整个歌单</p>
              <p className="mt-1 text-xs leading-5 text-ink-3">最后一首结束后回到第一首；关闭后播放到末尾即停止。</p>
            </div>
            <Switch checked={settings.loopPlaylist} onChange={(loopPlaylist) => setSettings({ ...settings, loopPlaylist })} label="循环歌单" />
          </div>
          <div className="py-4 last:pb-0">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[13.5px] font-medium text-ink">默认音量</p>
                <p className="mt-1 text-xs text-ink-3">访客调整后，浏览器会记住自己的音量。</p>
              </div>
              <span className="tabular-nums rounded-chip bg-subtle px-2.5 py-1 text-xs font-medium text-ink-2">{settings.defaultVolume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={settings.defaultVolume}
              onChange={(event) => setSettings({ ...settings, defaultVolume: Number(event.target.value) })}
              className="w-full cursor-pointer accent-amber-500"
              aria-label="默认音量"
            />
          </div>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface shadow-soft">
        <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">歌曲列表</h2>
            <p className="mt-1 text-xs text-ink-3">支持本站上传，也可以粘贴可直接播放的公开音频地址。</p>
          </div>
          <div className="flex flex-col gap-2 min-[420px]:flex-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.m4a,.wav,.ogg,audio/mpeg,audio/mp4,audio/wav,audio/ogg"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || settings.tracks.length >= MAX_MUSIC_TRACKS}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn border border-line-strong px-4 text-[13px] font-medium text-ink-2 hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              <span>{uploading ? '上传中…' : '上传歌曲'}</span>
            </button>
            <button
              type="button"
              onClick={() => addTrack()}
              disabled={settings.tracks.length >= MAX_MUSIC_TRACKS}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-4 text-[13px] font-medium text-brand-ink hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>添加外链歌曲</span>
            </button>
          </div>
        </div>

        {settings.tracks.length ? (
          <div className="space-y-4 p-4 sm:p-6">
            {settings.tracks.map((track, index) => (
              <article key={track.id} className="rounded-card border border-line bg-subtle/60 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <GripVertical className="hidden h-4 w-4 shrink-0 text-ink-4 sm:block" />
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-chip bg-surface text-xs font-semibold text-ink-3 shadow-soft">{index + 1}</span>
                  <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs font-medium text-ink-2">
                    <input
                      type="radio"
                      name="default-track"
                      checked={settings.defaultTrackId === track.id}
                      onChange={() => setSettings({ ...settings, defaultTrackId: track.id })}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span>设为默认歌曲</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveTrack(index, -1)} disabled={index === 0} className="grid h-11 w-11 place-items-center rounded-btn text-ink-3 hover:bg-surface hover:text-ink disabled:opacity-30" aria-label={`上移 ${track.title || `第 ${index + 1} 首歌曲`}`}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveTrack(index, 1)} disabled={index === settings.tracks.length - 1} className="grid h-11 w-11 place-items-center rounded-btn text-ink-3 hover:bg-surface hover:text-ink disabled:opacity-30" aria-label={`下移 ${track.title || `第 ${index + 1} 首歌曲`}`}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeTrack(track.id)} className="grid h-11 w-11 place-items-center rounded-btn text-ink-3 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" aria-label={`删除 ${track.title || `第 ${index + 1} 首歌曲`}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-2">歌曲名称</span>
                    <input type="text" value={track.title} onChange={(event) => updateTrack(track.id, { title: event.target.value })} maxLength={100} placeholder="例如：Night Coding" className="w-full rounded-btn border border-line-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ink/10" required />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-2">歌手 / 来源（可选）</span>
                    <input type="text" value={track.artist} onChange={(event) => updateTrack(track.id, { artist: event.target.value })} maxLength={100} placeholder="例如：WebCoding Studio" className="w-full rounded-btn border border-line-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ink/10" />
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-2">音频地址</span>
                  <input type="text" inputMode="url" value={track.url} onChange={(event) => updateTrack(track.id, { url: event.target.value })} maxLength={2048} placeholder="https://example.com/music.mp3" className="w-full rounded-btn border border-line-strong bg-surface px-3.5 py-2.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ink/10" required />
                </label>
                {track.url ? (
                  <audio controls preload="none" src={track.url} className="mt-4 h-10 w-full" aria-label={`试听 ${track.title || `第 ${index + 1} 首歌曲`}`} />
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <Music2 className="mx-auto h-7 w-7 text-ink-4" />
            <p className="mt-3 text-sm font-medium text-ink">歌单还是空的</p>
            <p className="mt-1 text-xs leading-5 text-ink-3">上传第一首歌曲，或添加一个可直接播放的音频链接。</p>
          </div>
        )}
      </section>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving || uploading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-btn bg-brand px-6 text-sm font-semibold text-brand-ink shadow-card transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? '保存中…' : '保存音乐设置'}</span>
        </button>
      </div>
    </form>
  )
}
