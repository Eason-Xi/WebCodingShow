import { createHash } from 'node:crypto'
import type { PrismaClient } from '@prisma/client'
import { fetchProjectMetadata } from './project-metadata'
import { normalizeProjectUrl, ProjectImportError } from './project-url'
import type { ProjectMetadata } from './website-metadata'

type Category = { id: string; name: string; slug: string }
const include = { category: true, tags: true } as const
const hash = (value: string) => createHash('sha256').update(value).digest('hex').slice(0, 32)
const importSlug = (url: string) => `import-${hash(url)}`

function canonical(input?: string | null) {
  try { return input ? normalizeProjectUrl(input) : '' } catch { return '' }
}

export function matchImportCategory(categories: Category[], metadata: ProjectMetadata): Category | undefined {
  const text = `${metadata.title} ${metadata.summary} ${(metadata.tags || []).join(' ')}`.toLowerCase()
  const rules: [RegExp, RegExp][] = [
    [/游戏|game/i, /游戏|\b(game|gaming|roguelike|puzzle)\b/i],
    [/数据可视化|visualization/i, /可视化|\b(visualization|charts?|d3)\b/i],
    [/创意|交互|creative/i, /着色器|三维|\b(webgl|three\.js|shader|creative)\b/i],
    [/ai|人工智能/i, /人工智能|大模型|智能体|\b(ai|llm|gpt|agent|chatbot|prompt)\b/i],
    [/效率|工具|tool|productivity/i, /效率|工具|\b(tool|productivity|dashboard|editor)\b/i],
  ]
  for (const [name, content] of rules) {
    if (content.test(text)) {
      const category = categories.find((item) => name.test(item.name) || name.test(item.slug))
      if (category) return category
    }
  }
  return categories.find((item) => item.name.length > 1 && text.includes(item.name.toLowerCase()))
}

async function findExisting(db: PrismaClient, urls: string[], repository?: string) {
  const keys = new Set(urls.map(canonical).filter(Boolean))
  const projects = await db.project.findMany({ select: { id: true, url: true, sourceUrl: true, slug: true } })
  const existing = projects.find((project) => {
    // Distinct repositories may legitimately share an organization homepage.
    if (repository && canonical(project.sourceUrl) && canonical(project.sourceUrl) !== repository) return false
    return keys.has(canonical(project.url)) || keys.has(canonical(project.sourceUrl))
      || [...keys].some((key) => project.slug === importSlug(key))
  })
  return existing ? db.project.findUnique({ where: { id: existing.id }, include }) : null
}

export async function importProject(
  db: PrismaClient,
  input: { url: unknown; categoryId?: unknown },
  loadMetadata: (url: string) => Promise<ProjectMetadata> = fetchProjectMetadata,
) {
  const inputUrl = normalizeProjectUrl(typeof input.url === 'string' ? input.url : '')
  if (input.categoryId !== undefined && typeof input.categoryId !== 'string') {
    throw new ProjectImportError('分类参数不正确')
  }
  const duplicate = await findExisting(db, [inputUrl])
  if (duplicate) return { project: duplicate, duplicate: true, warnings: ['该地址已收录，原有资料和发布状态保持不变。'] }

  const categories = await db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] })
  const selectedCategory = input.categoryId ? categories.find((item) => item.id === input.categoryId) : undefined
  if (input.categoryId && !selectedCategory) throw new ProjectImportError('所选分类已不存在，请刷新页面后重试')

  // Fetch everything before opening a transaction so timeouts never leave a partial project.
  const metadata = await loadMetadata(inputUrl)
  const warnings: string[] = []
  const url = canonical(metadata.url) || inputUrl
  const sourceUrl = canonical(metadata.sourceUrl)
  const identity = metadata.source === 'github' && sourceUrl ? sourceUrl : url
  const existing = await findExisting(db, [inputUrl, url, sourceUrl], metadata.source === 'github' ? sourceUrl : undefined)
  if (existing) return { project: existing, duplicate: true, warnings: ['已找到同一项目，原有资料和发布状态保持不变。'] }

  const title = metadata.title.trim().slice(0, 160) || new URL(url).hostname
  const summary = metadata.summary.trim().slice(0, 300) || `从 ${new URL(url).hostname} 导入的项目，简介待补充。`
  const cover = canonical(metadata.cover) ? metadata.cover : null
  if (!metadata.title.trim()) warnings.push('未读取到名称，暂用网站域名，请检查并修改。')
  if (!metadata.summary.trim()) warnings.push('未读取到简介，已填写待补充提示，请在发布前完善。')
  if (!cover) warnings.push('未读取到可用封面，可在编辑页上传图片。')
  if (metadata.partial) warnings.push('GitHub 部分资料暂未获取，已保存可读取的信息。')
  if (metadata.completedAt) warnings.push('完成年月取自仓库最近推送月份，请核对。')
  const category = selectedCategory || matchImportCategory(categories, metadata)
  if (!category) warnings.push('未匹配到现有分类，已放入“导入待整理”。')
  else if (!selectedCategory) warnings.push(`已自动匹配“${category.name}”，请核对分类。`)

  try {
    const project = await db.$transaction(async (tx) => {
      const targetCategory = category || await tx.category.upsert({
        where: { slug: 'import-inbox' }, update: {}, create: { name: '导入待整理', slug: 'import-inbox', sortOrder: 999 },
      })
      const tagIds: { id: string }[] = []
      const seen = new Set<string>()
      for (const tag of (metadata.tags || []).slice(0, 12)) {
        const name = tag.trim().slice(0, 50)
        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())
        const existingTag = await tx.tag.findFirst({ where: { name } })
        const saved = existingTag || await tx.tag.upsert({
          where: { name }, update: {}, create: { name, slug: `tag-${hash(name)}` },
        })
        tagIds.push({ id: saved.id })
      }
      return tx.project.create({
        data: {
          title, summary, url, cover, slug: importSlug(identity), categoryId: targetCategory.id,
          description: metadata.description?.trim().slice(0, 12000) || summary,
          sourceUrl: sourceUrl || null,
          completedAt: /^\d{4}-(0[1-9]|1[0-2])$/.test(metadata.completedAt || '') ? metadata.completedAt : null,
          images: '[]', status: 'draft', featured: false, sortOrder: 0,
          tags: { connect: tagIds },
        }, include,
      })
    })
    return { project, duplicate: false, warnings }
  } catch (error) {
    // The unique, deterministic slug also protects simultaneous requests and retries.
    const saved = await db.project.findUnique({ where: { slug: importSlug(identity) }, include })
    if (saved) return { project: saved, duplicate: true, warnings: ['该项目已经保存，请打开已有记录。'] }
    throw error
  }
}
