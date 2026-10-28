import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { blogPostPath } from '@/lib/blog-post'
import { podcastPath } from '@/lib/podcasts'

export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://webcoding-show.vercel.app').replace(/\/$/, '')
  const [projects, posts, podcastEpisodes] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'published' },
      select: { id: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.podcastEpisode.findMany({ select: { id: true, publishedAt: true, createdAt: true } }),
  ])

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/projects`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/videos`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/podcasts`, changeFrequency: 'weekly', priority: 0.9 },
    ...podcastEpisodes.map((episode) => ({
      url: `${baseUrl}${podcastPath(episode.id)}`,
      lastModified: episode.publishedAt || episode.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...projects.map((project) => ({
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: project.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}${blogPostPath(post.slug)}`,
      lastModified: post.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
