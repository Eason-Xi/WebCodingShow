import { PrismaClient } from '@prisma/client'
import { loadEnvConfig } from '@next/env'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { readProjectImages } from '../src/lib/project-images'
import { settingsFromRecord } from '../src/lib/music'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
const file = process.argv[3] || 'backups/portfolio.json'
const mode = process.argv[2]

async function snapshot() {
  const [profiles, categories, tags, projects, posts, musicSettings, podcasts, podcastEpisodes] = await Promise.all([
    prisma.profile.findMany(), prisma.category.findMany(), prisma.tag.findMany(),
    prisma.project.findMany({ include: { tags: { select: { id: true } } } }),
    prisma.blogPost.findMany(),
    prisma.musicSettings.findMany(), prisma.podcast.findMany(), prisma.podcastEpisode.findMany(),
  ])
  return { version: 4 as const, profiles, categories, tags, projects, posts, musicSettings, podcasts, podcastEpisodes }
}

type CurrentSnapshot = Awaited<ReturnType<typeof snapshot>>
type LegacySnapshotV3 = Omit<CurrentSnapshot, 'version' | 'podcasts' | 'podcastEpisodes'> & { version: 3 }
type LegacySnapshotV2 = Omit<LegacySnapshotV3, 'version' | 'musicSettings'> & {
  version: 2
  musicSettings?: never
}
type LegacySnapshotV1 = Omit<LegacySnapshotV2, 'version' | 'posts'> & {
  version: 1
  posts?: never
}
type Snapshot = CurrentSnapshot | LegacySnapshotV3 | LegacySnapshotV2 | LegacySnapshotV1

async function main() {
  if (mode === 'export') {
    const data = await snapshot()
    await mkdir(path.dirname(file), { recursive: true })
    // Never overwrite an earlier backup.
    await writeFile(file, JSON.stringify(data, null, 2), { flag: 'wx', mode: 0o600 })
    console.log(`Exported ${data.projects.length} projects, ${data.posts.length} posts and ${data.musicSettings.length} music settings to ${file}`)
    return
  }
  if (mode !== 'import') throw new Error('Use export or import [snapshot path]')
  if (!/^postgres(ql)?:/.test(process.env.DATABASE_URL || '')) {
    throw new Error('Import is only supported into PostgreSQL')
  }
  const data = JSON.parse(await readFile(file, 'utf8')) as Snapshot
  if (data.version !== 1 && data.version !== 2 && data.version !== 3 && data.version !== 4) throw new Error('Unsupported snapshot version')
  if (data.version !== 1 && !Array.isArray(data.posts)) throw new Error('Snapshot posts are invalid')
  if ((data.version === 3 || data.version === 4) && !Array.isArray(data.musicSettings)) throw new Error('Snapshot music settings are invalid')
  const posts: CurrentSnapshot['posts'] = data.version === 1 ? [] : data.posts
  const musicSettings: CurrentSnapshot['musicSettings'] = (data.version === 3 || data.version === 4) ? data.musicSettings : []
  if (data.version === 4 && (!Array.isArray(data.podcasts) || !Array.isArray(data.podcastEpisodes))) throw new Error('Snapshot podcasts are invalid')
  const podcasts = data.version === 4 ? data.podcasts : []
  const podcastEpisodes = data.version === 4 ? data.podcastEpisodes : []
  // A first-time migration only: never replace existing production content.
  const existing = await snapshot()
  if (existing.projects.length || existing.categories.length || existing.tags.length || existing.profiles.length || existing.posts.length || existing.musicSettings.length || existing.podcasts.length || existing.podcastEpisodes.length) {
    throw new Error('Target database must be empty; existing content was not changed')
  }
  const images = new Map<string, string>()
  const audio = new Map<string, string>()
  const uploads: Array<{ source: string; url: string }> = []
  async function imageUrl(url: string | null): Promise<string | null> {
    if (!url || (!url.startsWith('/api/uploads/') && !url.startsWith('/uploads/'))) return url
    if (images.has(url)) return images.get(url)!
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Blob token required for existing local images')
    const name = path.basename(url)
    const type = ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' } as Record<string, string>)[path.extname(name).toLowerCase()]
    if (!type) throw new Error(`Unsupported local image: ${name}`)
    const content = await readFile(path.join('public/uploads', name))
    const blob = await put(`migrated/${randomUUID()}${path.extname(name)}`, content, {
      access: 'public', contentType: type, addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    images.set(url, blob.url)
    uploads.push({ source: url, url: blob.url })
    return blob.url
  }
  async function audioUrl(url: string): Promise<string> {
    if (!url.startsWith('/api/music/files/')) return url
    if (audio.has(url)) return audio.get(url)!
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('Blob token required for existing local audio')
    const name = path.basename(url)
    const type = ({ '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg' } as Record<string, string>)[path.extname(name).toLowerCase()]
    if (!type) throw new Error(`Unsupported local audio: ${name}`)
    const content = await readFile(path.join('public/uploads/music', name))
    const blob = await put(`music/migrated/${randomUUID()}${path.extname(name)}`, content, {
      access: 'public', contentType: type, addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    audio.set(url, blob.url)
    uploads.push({ source: url, url: blob.url })
    return blob.url
  }
  try {
    for (const profile of data.profiles) profile.avatar = await imageUrl(profile.avatar)
    for (const project of data.projects) {
      project.cover = await imageUrl(project.cover)
      project.images = JSON.stringify(await Promise.all(readProjectImages(project.images).map(imageUrl)))
    }
    for (const post of posts) post.cover = await imageUrl(post.cover)
    for (const setting of musicSettings) {
      const parsed = settingsFromRecord(setting)
      setting.tracks = JSON.stringify(await Promise.all(parsed.tracks.map(async (track) => ({
        ...track,
        url: await audioUrl(track.url),
      }))))
    }
    await prisma.$transaction(async (tx) => {
      for (const profile of data.profiles) await tx.profile.create({ data: profile })
      for (const category of data.categories) await tx.category.create({ data: category })
      for (const tag of data.tags) await tx.tag.create({ data: tag })
      for (const project of data.projects) {
        const { tags, ...fields } = project
        await tx.project.create({ data: { ...fields, tags: { connect: tags } } })
      }
      for (const post of posts) await tx.blogPost.create({ data: post })
      for (const setting of musicSettings) await tx.musicSettings.create({ data: setting })
      for (const podcast of podcasts) await tx.podcast.create({ data: podcast })
      for (const episode of podcastEpisodes) await tx.podcastEpisode.create({ data: episode })
    }, { timeout: 60000 })
    console.log(`Imported ${data.projects.length} projects, ${posts.length} posts and ${musicSettings.length} music settings; migrated ${images.size} local images and ${audio.size} local audio files`)
  } finally {
    if (uploads.length) {
      await mkdir('backups', { recursive: true })
      await writeFile(`backups/blob-transfer-${Date.now()}.json`, JSON.stringify(uploads, null, 2), { mode: 0o600 })
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Transfer failed')
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
