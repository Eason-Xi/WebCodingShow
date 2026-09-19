'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Save, Upload, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'

export function ProfileForm() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [xUrl, setXUrl] = useState('')
  const [email, setEmail] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setName(data.name || '')
          setTitle(data.title || '')
          setBio(data.bio || '')
          setAvatar(data.avatar || '')
          setGithubUrl(data.githubUrl || '')
          setXUrl(data.xUrl || '')
          setEmail(data.email || '')
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 0 毫秒即时预览
    const objectUrl = URL.createObjectURL(file)
    setAvatar(objectUrl)
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '头像上传失败')

      setAvatar(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          bio,
          avatar,
          githubUrl,
          xUrl,
          email,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存资料失败')

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-sm text-ink-3">
        加载个人资料中...
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-10 max-w-3xl w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">
          个人资料与名片
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          配置前台首页 Hero 区域展示的姓名、职业定位、个人介绍及社交联系外链。
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-card bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-card bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>个人资料已更新，前台首页已即时生效！</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 rounded-card bg-surface border border-line shadow-soft space-y-5">
          {/* 头像 */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-2">
              个人头像
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-subtle border border-line shrink-0">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-3">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="输入头像图片 URL..."
                  className="w-full px-3 py-2 rounded-btn border border-line-strong bg-subtle text-xs font-mono mb-2"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink-2 hover:bg-subtle transition-colors inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3 h-3" />
                  <span>{uploading ? '上传中...' : '上传本地头像'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                展示姓名 / 昵称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Alex Chen"
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                职业定位 / 核心头衔
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：Full-Stack Developer & Creative Coder"
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              一句话自我介绍 (Hero Bio)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="概括你的核心技术专长、设计审美或创作初衷..."
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none"
            />
          </div>
        </div>

        {/* 社交联系外链 */}
        <div className="p-6 rounded-card bg-surface border border-line shadow-soft space-y-4">
          <h2 className="text-sm font-semibold text-ink border-b border-line pb-3">
            社交与联系外链（展示于页脚与前台）
          </h2>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              GitHub 地址
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourname"
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-xs font-mono focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              Twitter / X 主页
            </label>
            <input
              type="url"
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
              placeholder="https://x.com/yourhandle"
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-xs font-mono focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              联系邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-xs font-mono focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-brand text-brand-ink text-sm font-medium hover:opacity-90 active:scale-98 transition-all shadow-soft cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存资料'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
