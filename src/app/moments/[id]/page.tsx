import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { momentResponse, momentShareTitle } from '@/lib/moments'
import { MomentCard } from '@/components/MomentCard'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const revalidate = 0
type Context = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Context): Promise<Metadata> {
  const { id } = await params
  const record = await prisma.moment.findFirst({ where: { id, status: 'published' } })
  if (!record) return { title: '动态不存在', robots: { index: false } }
  const moment = momentResponse(record)
  const title = momentShareTitle(moment.content)
  const images = moment.media.filter(media => media.type.startsWith('image/')).map(media => ({ url: media.url, alt: media.name }))
  return { title, description: Array.from(moment.content).slice(0, 160).join(''), alternates: { canonical: `/moments/${id}` }, openGraph: { title, images, type: 'article', publishedTime: moment.publishedAt || moment.createdAt } }
}

export default async function MomentPage({ params }: Context) {
  const { id } = await params
  const [record, profile] = await Promise.all([
    prisma.moment.findFirst({ where: { id, status: 'published' } }),
    prisma.profile.findUnique({ where: { id: 'default' } }),
  ])
  if (!record) notFound()
  return <div className="flex min-h-screen flex-col"><Navbar /><main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8"><Link href="/moments" className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-ink-2"><ArrowLeft className="h-4 w-4" />全部动态</Link><h1 className="sr-only">{momentShareTitle(record.content)}</h1><MomentCard moment={momentResponse(record)} author={{ name: profile?.name || 'Web 独立创作者', avatar: profile?.avatar || null }} /></main><Footer profile={profile || undefined} /></div>
}
