import { PrismaClient } from '@prisma/client'
import { loadEnvConfig } from '@next/env'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { put } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { readProjectImages } from '../src/lib/project-images'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
const file = process.argv[3] || 'backups/portfolio.json'
const mode = process.argv[2]

async function snapshot() {
  const [profiles, categories, tags, projects] = await Promise.all([
    prisma.profile.findMany(), prisma.category.findMany(), prisma.tag.findMany(),
    prisma.project.findMany({ include: { tags: { select: { id: true } } } }),
  ])
  return { version: 1, profiles, categories, tags, projects }
}

async function main() {
  if (mode === 'export') {
    const data = await snapshot()
    await mkdir(path.dirname(file), { recursive: true })
    // Never overwrite an earlier backup.
    await writeFile(file, JSON.stringify(data, null, 2), { flag: 'wx', mode: 0o600 })
    console.log(`Exported ${data.projects.length} projects to ${file}`)
    return
  }
  if (mode !== 'import') throw new Error('Use export or import [snapshot path]')
  if (!/^postgres(ql)?:/.test(process.env.DATABASE_URL || '')) {
    throw new Error('Import is only supported into PostgreSQL')
  }
  const data = JSON.parse(await readFile(file, 'utf8')) as Awaited<ReturnType<typeof snapshot>>
  if (data.version !== 1) throw new Error('Unsupported snapshot version')
  // A first-time migration only: never replace existing production content.
  const existing = await snapshot()
  if (existing.projects.length || existing.categories.length || existing.tags.length || existing.profiles.length) {
    throw new Error('Target database must be empty; existing content was not changed')
  }
  const images = new Map<string, string>()
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
  try {
    for (const profile of data.profiles) profile.avatar = await imageUrl(profile.avatar)
    for (const project of data.projects) {
      project.cover = await imageUrl(project.cover)
      project.images = JSON.stringify(await Promise.all(readProjectImages(project.images).map(imageUrl)))
    }
    await prisma.$transaction(async (tx) => {
      for (const profile of data.profiles) await tx.profile.create({ data: profile })
      for (const category of data.categories) await tx.category.create({ data: category })
      for (const tag of data.tags) await tx.tag.create({ data: tag })
      for (const project of data.projects) {
        const { tags, ...fields } = project
        await tx.project.create({ data: { ...fields, tags: { connect: tags } } })
      }
    }, { timeout: 60000 })
    console.log(`Imported ${data.projects.length} projects; migrated ${images.size} local images`)
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
