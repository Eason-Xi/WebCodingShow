import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquareText, PenLine } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { momentResponse } from '@/lib/moments'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MomentCard } from '@/components/MomentCard'

export const revalidate = 0
export const metadata: Metadata = { title: '动态', description: '记录创作进展、灵感与日常，一条属于自己的时间线。', alternates: { canonical: '/moments' } }

export default async function MomentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams
  const parsed = Number(params.page || 1)
  const page = Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 100000 ? parsed : 1
  const [profile, records, total] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 'default' } }),
    prisma.moment.findMany({ where: { status: 'published' }, orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * 20, take: 20 }),
    prisma.moment.count({ where: { status: 'published' } }),
  ])
  const author = { name: profile?.name || 'Web 独立创作者', avatar: profile?.avatar || null }
  const pages = Math.ceil(total / 20)
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
    <header className="mb-10"><div className="mb-4 flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-amber-700 dark:text-amber-400"><MessageSquareText className="h-4 w-4 shrink-0" />LIFE IN PROGRESS</p><Link href="/admin/moments" className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-btn border border-line bg-surface px-4 text-sm text-ink-2 hover:bg-subtle"><PenLine className="h-4 w-4" />写动态</Link></div><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">灵感，不止于作品。</h1><p className="mt-5 text-sm leading-7 text-ink-2">那些正在发生的事，和一路上的小小发现。</p><p className="mt-4 text-xs text-ink-3">{author.name} · {total} 条动态</p></header>
    <section aria-label="动态时间线" className="space-y-5">{records.map(record => <MomentCard key={record.id} moment={momentResponse(record)} author={author} />)}{records.length === 0 && <div className="rounded-panel border border-dashed border-line-strong px-5 py-16 text-center"><MessageSquareText className="mx-auto mb-4 h-8 w-8 text-ink-3" /><p className="text-sm text-ink-2">{page > 1 ? '这一页暂时没有动态。' : '第一条动态，即将发生。'}</p>{page > 1 && <Link href="/moments" className="mt-4 inline-flex min-h-11 items-center text-sm underline">回到最新动态</Link>}</div>}</section>
    {pages > 1 && <nav aria-label="动态分页" className="mt-9 flex items-center justify-center gap-5 text-sm">{page > 1 && <Link href={`/moments?page=${page - 1}`} className="inline-flex min-h-11 items-center rounded-btn border border-line px-4">上一页</Link>}<span className="text-ink-3">{page} / {pages}</span>{page < pages && <Link href={`/moments?page=${page + 1}`} className="inline-flex min-h-11 items-center rounded-btn border border-line px-4">下一页</Link>}</nav>}
  </main><Footer profile={profile || undefined} /></div>
}
