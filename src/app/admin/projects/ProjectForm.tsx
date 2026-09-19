'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  Link2,
  Sparkles,
  Save,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface ProjectData {
  id?: string
  title?: string
  url?: string
  summary?: string
  cover?: string | null
  categoryId?: string
  tags?: { name: string }[] | string[]
  status?: string
  featured?: boolean
  sortOrder?: number
  sourceUrl?: string | null
  completedAt?: string | null
  description?: string | null
}

interface ProjectFormProps {
  initialData?: ProjectData
  isEdit?: boolean
}

export function ProjectForm({ initialData, isEdit = false }: ProjectFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // 表单状态
  const [title, setTitle] = useState(initialData?.title || '')
  const [url, setUrl] = useState(initialData?.url || '')
  const [summary, setSummary] = useState(initialData?.summary || '')
  const [cover, setCover] = useState(initialData?.cover || '')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [tagsInput, setTagsInput] = useState('')
  const [status, setStatus] = useState(initialData?.status || 'published')
  const [featured, setFeatured] = useState(Boolean(initialData?.featured))
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 0)
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '')
  const [completedAt, setCompletedAt] = useState(initialData?.completedAt || '')
  const [description, setDescription] = useState(initialData?.description || '')

  const [localPreview, setLocalPreview] = useState('')
  const [imageError, setImageError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 智能解析 URL 信息
  const handleFetchMeta = async () => {
    if (!url.trim() || !/^https?:\/\/.+/i.test(url.trim())) {
      setError('请先输入有效的 http:// 或 https:// 线上 URL')
      return
    }

    setFetchingMeta(true)
    setError('')
    try {
      const res = await fetch('/api/fetch-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '解析失败')

      if (data.title && !title) setTitle(data.title)
      if (data.summary && !summary) setSummary(data.summary)
      if (data.cover && !cover) {
        setCover(data.cover)
        setImageError(false)
      }
    } catch (err: any) {
      setError(err.message || '解析失败，请手动填写')
    } finally {
      setFetchingMeta(false)
    }
  }

  // 处理初始 tags
  useEffect(() => {
    if (initialData?.tags) {
      const names = initialData.tags.map((t) => (typeof t === 'string' ? t : t.name))
      setTagsInput(names.join(', '))
    }
  }, [initialData])

  // 加载分类
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data)
          if (!categoryId && data.length > 0 && !isEdit) {
            setCategoryId(data[0].id)
          }
        }
      })
      .finally(() => setLoadingCategories(false))
  }, [])

  // 上传图片处理：立即本地显示预览，同时后台上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 0 毫秒本地即时预览
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    setImageError(false)
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
      if (!res.ok) throw new Error(data.error || '图片上传失败')

      setCover(data.url)
    } catch (err: any) {
      setError(err.message || '上传文件失败')
    } finally {
      setUploading(false)
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // 前端校验
    if (!title.trim()) return setError('请输入项目名称')
    if (!url.trim()) return setError('请输入线上 URL')
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      return setError('线上 URL 格式不正确，必须以 http:// 或 https:// 开头')
    }
    if (!summary.trim()) return setError('请输入一句话简介')
    if (!categoryId) return setError('请选择项目所属分类')

    // 解析标签
    const tags = tagsInput
      .split(/[,，、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)

    setSubmitting(true)

    const payload = {
      title,
      url,
      summary,
      cover,
      categoryId,
      tags,
      status,
      featured,
      sortOrder: Number(sortOrder) || 0,
      sourceUrl,
      completedAt,
      description,
    }

    try {
      const targetEndpoint = isEdit
        ? `/api/projects/${initialData?.id}`
        : '/api/projects'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(targetEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '保存项目失败')

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/projects')
        router.refresh()
      }, 800)
    } catch (err: any) {
      setError(err.message || '提交异常，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl w-full">
      {/* 顶部返回与标题 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="p-2 rounded-btn border border-line text-ink-3 hover:text-ink hover:bg-subtle transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {isEdit ? '编辑项目作品' : '录入新 Web 作品'}
            </h1>
            <p className="text-xs text-ink-3 mt-0.5">
              录入后前台将自动显示卡片并支持一键在新标签页体验
            </p>
          </div>
        </div>

        {/* 顶部操作区 */}
        <div className="flex items-center gap-3">
          {/* 快速精选开关徽章 */}
          <button
            type="button"
            onClick={() => setFeatured(!featured)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-btn text-xs font-medium cursor-pointer transition-all ${
              featured
                ? 'bg-amber-500 text-white shadow-soft'
                : 'bg-subtle text-ink-2 hover:bg-muted'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{featured ? '已设为首页精选' : '设为首页精选'}</span>
          </button>

          {/* 顶部主保存按钮 */}
          <button
            type="button"
            onClick={(e) => {
              const form = document.querySelector('form')
              if (form) form.requestSubmit()
            }}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-btn bg-brand hover:bg-brand-hover text-brand-ink text-xs sm:text-sm font-semibold shadow-soft hover:shadow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? '保存中...' : isEdit ? '更新项目' : '立即发布作品'}</span>
          </button>
        </div>
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
          <span>项目保存成功！正在跳转项目列表...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基础信息卡片 */}
        <div className="p-6 rounded-card bg-surface border border-line shadow-soft space-y-5">
          <h2 className="text-sm font-semibold text-ink border-b border-line pb-3">
            必填核心参数
          </h2>

          {/* 项目名称 */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：AI Interview Studio / Shader Flow"
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
              required
            />
          </div>

          {/* 线上跳转 URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-ink-2">
                线上 URL（核心体验地址） <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFetchMeta}
                disabled={fetchingMeta}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-2 hover:underline cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{fetchingMeta ? '正在智能解析网页...' : '🪄 智能提取网页标题与简介'}</span>
              </button>
            </div>
            <div className="relative">
              <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://demo.example.com 或任意可访问的 Web 链接"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono text-xs"
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-3">
              访客点击卡片“在线体验”时将通过安全新标签页打开该地址。
            </p>
          </div>

          {/* 一句话简介 */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              一句话简介（30–60 字） <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="简明扼要概括作品的定位、核心亮点或解决的痛点..."
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 resize-none"
              required
            />
          </div>

          {/* 分类与状态 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                所属分类 <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                发布状态 <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
              >
                <option value="published">已发布（前台即刻可见）</option>
                <option value="draft">草稿（仅后台可见）</option>
              </select>
            </div>
          </div>
        </div>

        {/* 封面与展示效果 */}
        <div className="p-6 rounded-card bg-surface border border-line shadow-soft space-y-5">
          <h2 className="text-sm font-semibold text-ink border-b border-line pb-3">
            封面视觉与呈现
          </h2>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              封面图片 URL 或本地上传
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="输入外部图片 URL (如 Unsplash/CDN) 或点击右侧本地上传..."
                className="flex-1 px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-xs font-mono focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2.5 rounded-btn border border-line hover:bg-subtle text-xs font-medium text-ink-2 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? '上传中...' : '上传本地截图'}</span>
              </button>
            </div>

            {/* 实时封面预览 */}
            {(localPreview || cover) && (
              <div className="mt-3 relative w-64 aspect-[16/10] rounded-btn overflow-hidden border border-line-strong bg-subtle shadow-soft">
                {!imageError ? (
                  <img
                    src={localPreview || cover}
                    alt="封面预览"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-red-50/50 dark:bg-red-950/20 text-red-500">
                    <AlertCircle className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">图片加载失败</span>
                    <span className="text-[10px] text-ink-3 mt-0.5">请检查 URL 是否有效或包含防盗链</span>
                  </div>
                )}

                {/* 上传中遮罩 */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1.5" />
                    <span className="text-xs font-medium">正在保存图片...</span>
                  </div>
                )}

                {/* 清除按钮 */}
                <button
                  type="button"
                  onClick={() => {
                    setCover('')
                    setLocalPreview('')
                    setImageError(false)
                  }}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-lg px-2 py-1 text-xs backdrop-blur-xs cursor-pointer transition-colors"
                >
                  清除封面
                </button>

                {/* 状态徽章 */}
                {!uploading && !imageError && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded text-[10px] font-mono">
                    ✓ 预览正常
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 标签、排序与补充信息 */}
        <div className="p-6 rounded-card bg-surface border border-line shadow-soft space-y-5">
          <h2 className="text-sm font-semibold text-ink border-b border-line pb-3">
            标签与扩展字段
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 技术标签 */}
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                技术/能力标签（以逗号或空格分隔）
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="例如：React, Three.js, AI, Canvas"
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>

            {/* 完成年月 */}
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                完成年月（用于时间排序/展示）
              </label>
              <input
                type="text"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                placeholder="例如：2026-09"
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 排序权重 */}
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                排序权重（数值越大越靠前，默认 0）
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono"
              />
            </div>

            {/* 源码链接 */}
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1.5">
                源码 GitHub URL（可选）
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono text-xs"
              />
            </div>
          </div>

          {/* 详情说明 */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              深度技术说明 / 难点与成果（选填）
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="记录开发过程中的架构设计、攻克的技术挑战或核心收益..."
              className="w-full px-3.5 py-2.5 rounded-btn border border-line-strong bg-subtle text-sm focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
        </div>

        {/* 底部保存提交栏 */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-line">
          <Link
            href="/admin/projects"
            className="inline-flex items-center justify-center px-6 py-3 rounded-btn border border-line-strong text-sm font-medium text-ink-2 hover:bg-subtle transition-colors text-center"
          >
            ← 取消返回列表
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-btn bg-brand hover:bg-brand-hover text-brand-ink text-sm font-bold shadow-card hover:shadow-lift active:scale-98 transition-all cursor-pointer disabled:opacity-50 min-w-[200px]"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? '正在保存发布...' : isEdit ? '保存更新项目' : '立即发布新作品 🚀'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
