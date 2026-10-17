'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, FileText, FolderCheck, Globe, Link2, LoaderCircle } from 'lucide-react'

interface ImportResult {
  duplicate: boolean
  warnings: string[]
  project: {
    id: string
    title: string
    summary: string
    url: string
    cover: string | null
    status: string
    category: { name: string }
    tags: { id: string; name: string }[]
  }
}

export function ImportProjectForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const inFlight = useRef(false)
  const urlInput = useRef<HTMLInputElement>(null)

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setSubmitting(true)
    setError('')
    setNeedsLogin(false)
    setResult(null)
    try {
      const response = await fetch('/api/projects/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), categoryId: categoryId || undefined }),
        signal: AbortSignal.timeout(40_000),
      })
      const data = await response.json()
      if (!response.ok) {
        setNeedsLogin(response.status === 401)
        throw new Error(data.error || '导入失败，请稍后重试')
      }
      setResult(data)
      setImageFailed(false)
    } catch (error) {
      setError(error instanceof Error && error.name !== 'TimeoutError' && error.name !== 'TypeError'
        ? error.message : '暂未收到导入结果，请重试。同一地址不会重复创建作品。')
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return <div className="w-full max-w-4xl p-4 sm:p-6 xl:p-10">
    <div className="mb-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-2">
        <Link2 size={14} /> 从一个链接开始
      </div>
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">链接导入</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-ink-2">粘贴项目网址或 GitHub 仓库地址，自动提取资料并保存为草稿。检查完善后，再发布到作品集。</p>
    </div>

    <div className="mb-6 grid gap-3 sm:grid-cols-3">
      {[
        { icon: Link2, title: '01 · 提供地址', detail: '支持公开网页和 GitHub 仓库' },
        { icon: FileText, title: '02 · 自动整理', detail: '提取名称、简介、封面等信息' },
        { icon: FolderCheck, title: '03 · 存入草稿', detail: '在后台检查、补充并发布' },
      ].map(({ icon: Icon, title, detail }) => <div key={title} className="flex items-start gap-3 rounded-card border border-line bg-surface p-4">
        <Icon className="mt-0.5 shrink-0 text-ink-3" size={18} />
        <div><p className="text-sm font-medium text-ink">{title}</p><p className="mt-1 text-xs leading-5 text-ink-3">{detail}</p></div>
      </div>)}
    </div>

    <form onSubmit={handleImport} aria-busy={submitting} className="rounded-panel border border-line bg-surface p-5 shadow-soft sm:p-7">
      <label htmlFor="import-url" className="mb-2 block text-sm font-medium text-ink">项目地址</label>
      <input ref={urlInput} id="import-url" name="url" type="url" required maxLength={2048} autoComplete="url"
        placeholder="https://github.com/用户名/仓库名"
        value={url} onChange={(event) => setUrl(event.target.value)} disabled={submitting}
        aria-describedby="import-url-help"
        className="min-h-12 w-full rounded-btn border border-line-strong bg-canvas px-4 py-3 text-base text-ink outline-none focus:ring-2 focus:ring-ink/15 disabled:opacity-60" />
      <p id="import-url-help" className="mt-2 text-xs leading-6 text-ink-3">也可以填写项目的在线体验网址。GitHub 仓库会额外提取技术标签和源码信息。</p>

      <div className="mt-6">
        <label htmlFor="import-category" className="mb-2 block text-sm font-medium text-ink">项目分类 <span className="font-normal text-ink-3">· 可选</span></label>
        <select id="import-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={submitting}
          className="min-h-11 w-full rounded-btn border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-ink/15">
          <option value="">自动匹配分类</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <p className="mt-2 text-xs leading-6 text-ink-3">无法匹配时，会自动放入“导入待整理”，之后可随时调整。</p>
      </div>

      {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-btn border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <div><p>{error}</p>{needsLogin && <Link className="mt-2 inline-block underline" href="/admin/login?from=%2Fadmin%2Fimport">重新登录后继续导入</Link>}</div>
      </div>}

      <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-ink-3">导入结果保存为草稿，前台发布由你决定。</p>
        <button type="submit" disabled={submitting || !url.trim()}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-btn bg-brand px-5 py-3 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Link2 size={17} />}
          {submitting ? '正在读取并保存…' : '导入并保存草稿'}
        </button>
      </div>
      {submitting && <p role="status" className="mt-3 text-sm text-ink-2">正在读取项目资料，请稍候。通常需要几秒钟。</p>}
    </form>

    <div aria-live="polite">
      {result && <section className="mt-6 overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
        <div className="flex items-center gap-2 border-b border-line bg-subtle px-5 py-4 text-sm font-medium text-ink">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          {result.duplicate ? '这个项目已在作品库中' : '已保存为草稿'}
        </div>
        <div className="p-5 sm:p-7">
          <div className="grid min-w-0 gap-5 sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-card border border-line bg-subtle">
              {result.project.cover && !imageFailed
                ? <Image unoptimized fill sizes="160px" src={result.project.cover} alt={`${result.project.title} 封面`} className="object-cover" onError={() => setImageFailed(true)} />
                : <Globe size={32} className="text-ink-4" />}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-2 text-xs text-ink-2">
                <span className="rounded-chip bg-subtle px-2 py-1">{result.project.category.name}</span>
                <span className="rounded-chip bg-subtle px-2 py-1">{result.project.status === 'published' ? '已发布' : '草稿'}</span>
              </div>
              <h2 className="break-words text-lg font-semibold text-ink">{result.project.title}</h2>
              <p className="mt-2 break-words text-sm leading-7 text-ink-2">{result.project.summary}</p>
              <p className="mt-2 break-all text-xs text-ink-3">{result.project.url}</p>
            </div>
          </div>
          {!!result.project.tags.length && <div className="mt-5 flex flex-wrap gap-2">{result.project.tags.map((tag) => <span key={tag.id} className="rounded-chip bg-subtle px-2.5 py-1 text-xs text-ink-2">{tag.name}</span>)}</div>}
          {!!result.warnings.length && <div className="mt-5 rounded-card bg-subtle p-4 text-sm leading-7 text-ink-2">
            <p className="mb-1 font-medium text-ink">{result.duplicate ? '收录说明' : '发布前请检查'}</p>
            <ul className="list-disc space-y-1 pl-5">{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </div>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={`/admin/projects/${result.project.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-4 py-3 text-sm font-medium text-brand-ink hover:bg-brand-hover">
              {result.duplicate ? '查看已有作品' : '检查并编辑草稿'}<ArrowRight size={16} />
            </Link>
            <button type="button" onClick={() => { setResult(null); setUrl(''); urlInput.current?.focus() }} className="min-h-11 rounded-btn border border-line px-4 py-3 text-sm text-ink-2 hover:bg-subtle">继续导入下一个</button>
          </div>
        </div>
      </section>}
    </div>
    <p className="mt-6 text-sm text-ink-3">想自己填写资料？<Link href="/admin/projects/new" className="ml-2 inline-flex min-h-11 items-center text-ink-2 underline underline-offset-4">手动录入作品</Link></p>
  </div>
}
