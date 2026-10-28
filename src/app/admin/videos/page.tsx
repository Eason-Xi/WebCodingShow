import Link from 'next/link'
import { Film, Plus, ArrowUpRight, Pencil } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { videoWorkUrl } from '@/lib/video-works'

export const revalidate = 0
export const metadata = { title: '影像创作管理' }

export default async function AdminVideosPage() {
  const projects = await prisma.project.findMany({ orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }] })
  const works = projects.filter(project => videoWorkUrl(project))
  return <div className="w-full max-w-6xl p-4 sm:p-6 xl:p-10">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">影像创作</h1><p className="mt-2 text-sm text-ink-2">管理 B 站影像作品。已发布的作品会自动展示在影像栏目，草稿仅在后台可见。</p></div><div className="flex flex-wrap gap-2"><Link href="/videos" className="inline-flex min-h-11 items-center gap-2 rounded-btn border border-line px-4 text-sm">预览影像页<ArrowUpRight className="h-4 w-4" /></Link><Link href="/admin/videos/new" className="inline-flex min-h-11 items-center gap-2 rounded-btn bg-brand px-4 text-sm text-brand-ink"><Plus className="h-4 w-4" />录入影像</Link></div></div>
    <div className="overflow-hidden rounded-panel border border-line bg-surface">{works.length ? works.map(work => <div key={work.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-5 last:border-b-0"><div className="flex min-w-0 flex-1 items-center gap-4"><Film className="h-6 w-6 shrink-0 text-ink-3" /><div className="min-w-0"><h2 className="break-words text-sm font-medium">{work.title}</h2><p className="mt-1 text-xs text-ink-3">{work.status === 'published' ? '已发布' : '草稿'} · {work.videoClickCount} 次视频点击</p></div></div><Link href={`/admin/projects/${work.id}/edit`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-btn border border-line px-4 text-xs"><Pencil className="h-3.5 w-3.5" />编辑作品</Link></div>) : <div className="px-6 py-16 text-center"><Film className="mx-auto h-8 w-8 text-ink-3" /><p className="mt-4 text-sm text-ink-2">添加第一个 B 站视频，开始你的影像作品集。</p><Link href="/admin/videos/new" className="mt-5 inline-flex min-h-11 items-center rounded-btn bg-brand px-5 text-sm text-brand-ink">录入第一部影像</Link></div>}</div>
    <p className="mt-5 text-xs leading-6 text-ink-3">沿用作品库的封面、分类、草稿和排序设置。作品的「视频演示链接」或「线上 URL」填写 B 站视频地址即可收录；删除操作可在项目管理中完成。</p>
  </div>
}
