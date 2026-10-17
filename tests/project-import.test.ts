import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { normalizeProjectUrl, isPublicAddress, ProjectImportError } from '../src/lib/project-url'
import { parseWebsiteMetadata, type ProjectMetadata } from '../src/lib/website-metadata'
import { importProject } from '../src/lib/project-import'
import { fetchPublicText } from '../src/lib/public-web-fetch'

const directory = mkdtempSync(join(tmpdir(), 'webcoding-import-test-'))
const databaseUrl = `file:${join(directory, 'test.db')}`
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
const website: ProjectMetadata = {
  source: 'website', title: 'Orbit Notes', summary: 'A focused writing tool.',
  url: 'https://orbit.example.com/', cover: 'https://orbit.example.com/cover.png', tags: ['React', 'react', 'TypeScript'],
}

before(() => {
  writeFileSync(join(directory, 'test.db'), '')
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe',
  })
})
beforeEach(async () => {
  await db.project.deleteMany()
  await db.category.deleteMany()
  await db.tag.deleteMany()
})
after(async () => {
  await db.$disconnect()
  rmSync(directory, { recursive: true, force: true })
})

test('URL aliases collapse tracking, fragments, trailing slashes and GitHub paths', () => {
  assert.equal(normalizeProjectUrl(' https://EXAMPLE.com/demo/?utm_source=news#about '), 'https://example.com/demo')
  assert.equal(normalizeProjectUrl('https://example.com/?b=2&a=1'), 'https://example.com?a=1&b=2')
  assert.equal(normalizeProjectUrl('https://www.github.com/Owner/Repo.git/tree/main?tab=readme'), 'https://github.com/owner/repo')
  assert.notEqual(normalizeProjectUrl('https://example.com/?id=1'), normalizeProjectUrl('https://example.com/?id=2'))
  for (const url of ['javascript:alert(1)', 'https://github.com/settings/profile', 'https://user:password@example.com', 'http://localhost', 'http://127.0.0.1', 'http://2130706433', 'http://[::1]', 'http://[::ffff:127.0.0.1]', 'http://169.254.169.254', 'https://example.com:8080']) {
    assert.throws(() => normalizeProjectUrl(url), ProjectImportError, url)
  }
})

test('private and reserved resolved addresses are blocked before requests', async () => {
  for (const ip of ['0.0.0.0', '10.1.2.3', '172.16.0.1', '192.168.0.1', '127.0.0.1', '100.64.0.1', '198.18.1.1', '169.254.169.254', '::1', 'fc00::1', 'fe80::1', '::ffff:7f00:1', '2001:db8::1', '2002:7f00:1::']) assert.equal(isPublicAddress(ip), false, ip)
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) assert.equal(isPublicAddress(ip), true, ip)
  await assert.rejects(fetchPublicText('http://127.0.0.1', { signal: AbortSignal.timeout(1000) }), ProjectImportError)
  await assert.rejects(fetchPublicText('https://example.com', { signal: AbortSignal.abort() }))
})

test('web extraction handles reordered attributes, entities, relative images and missing fields', () => {
  const metadata = parseWebsiteMetadata(`<title>Fallback</title><meta content="Orbit &amp; Notes" property="og:title">
    <meta NAME=description CONTENT="A writer's tool &quot;for ideas&quot; &#x1F4DD;.">
    <meta content="../cover.png" property="og:image"><meta name=keywords content="React,TypeScript,React">
    <script>"<meta property='og:description' content='untrusted script'>"</script>`, 'https://example.com/app/home')
  assert.equal(metadata.title, 'Orbit & Notes')
  assert.equal(metadata.summary, 'A writer\'s tool "for ideas" 📝.')
  assert.equal(metadata.cover, 'https://example.com/cover.png')
  assert.deepEqual(metadata.tags, ['React', 'TypeScript'])
  assert.equal(parseWebsiteMetadata('<html></html>', 'https://example.com').title, '')
  assert.equal(parseWebsiteMetadata('<meta property="og:image" content="javascript:alert(1)">', 'https://example.com').cover, '')
})

test('one URL creates a persisted draft, matches a category and deduplicates tags', async () => {
  const category = await db.category.create({ data: { name: '效率工具', slug: 'tools' } })
  const result = await importProject(db, { url: website.url }, async () => website)
  assert.equal(result.duplicate, false)
  assert.equal(result.project.status, 'draft')
  assert.equal(result.project.featured, false)
  assert.equal(result.project.categoryId, category.id)
  assert.equal(result.project.tags.length, 2)
  assert.equal(result.project.cover, website.cover)
  assert.equal((await db.project.findUniqueOrThrow({ where: { id: result.project.id } })).summary, website.summary)
  assert.equal(await db.project.count({ where: { status: 'published' } }), 0)
})

test('retries return an existing record without fetching or overwriting reviewed data', async () => {
  const first = await importProject(db, { url: website.url }, async () => website)
  await db.project.update({ where: { id: first.project.id }, data: { title: 'Reviewed title', status: 'published' } })
  const again = await importProject(db, { url: `${website.url}?utm_source=test#intro` }, async () => { throw new Error('must not fetch') })
  assert.equal(again.duplicate, true)
  assert.equal(again.project.id, first.project.id)
  assert.equal(again.project.title, 'Reviewed title')
  assert.equal(again.project.status, 'published')
  assert.equal(await db.project.count(), 1)
})

test('GitHub aliases reuse manually created entries', async () => {
  const category = await db.category.create({ data: { name: '工具', slug: 'tools' } })
  const existing = await db.project.create({ data: {
    title: 'Existing', slug: 'existing', url: website.url, sourceUrl: 'https://github.com/Owner/Repo.git',
    summary: 'Keep this', categoryId: category.id,
  } })
  const result = await importProject(db, { url: 'https://github.com/owner/repo/tree/main' }, async () => { throw new Error('must not fetch') })
  assert.equal(result.project.id, existing.id)
  assert.equal(result.duplicate, true)
})

test('redirect targets deduplicate, but different GitHub repositories can share a homepage', async () => {
  const first = await importProject(db, { url: website.url }, async () => website)
  const redirect = await importProject(db, { url: 'https://short.example.com/demo' }, async () => website)
  assert.equal(redirect.project.id, first.project.id)
  assert.equal(redirect.duplicate, true)
  await db.project.deleteMany()
  for (const repo of ['one', 'two']) {
    const sourceUrl = `https://github.com/owner/${repo}`
    const result = await importProject(db, { url: sourceUrl }, async () => ({ ...website, source: 'github', sourceUrl }))
    assert.equal(result.duplicate, false)
    assert.equal(result.project.sourceUrl, sourceUrl)
  }
  assert.equal(await db.project.count(), 2)
})

test('missing metadata falls back transparently and creates an inbox category', async () => {
  const result = await importProject(db, { url: website.url }, async () => ({ ...website, title: '', summary: '', cover: '', tags: [] }))
  assert.equal(result.project.title, 'orbit.example.com')
  assert.match(result.project.summary, /待补充/)
  assert.equal(result.project.cover, null)
  assert.equal(result.project.category.name, '导入待整理')
  assert.equal(result.project.completedAt, null)
  assert.equal(result.warnings.length, 4)
})

test('manual category wins, and invalid category or fetch failures leave no partial writes', async () => {
  const category = await db.category.create({ data: { name: '实验项目', slug: 'experiments' } })
  await assert.rejects(importProject(db, { url: website.url, categoryId: 'missing' }, async () => website), /分类已不存在/)
  await assert.rejects(importProject(db, { url: website.url }, async () => { throw new ProjectImportError('读取超时', 504) }), /读取超时/)
  assert.equal(await db.project.count(), 0)
  assert.equal(await db.tag.count(), 0)
  assert.equal(await db.category.count(), 1)
  const result = await importProject(db, { url: website.url, categoryId: category.id }, async () => website)
  assert.equal(result.project.categoryId, category.id)
})

test('simultaneous imports only create one draft', async () => {
  const results = await Promise.all([
    importProject(db, { url: website.url }, async () => website),
    importProject(db, { url: website.url }, async () => website),
  ])
  assert.equal(await db.project.count(), 1)
  assert.equal(results[0].project.id, results[1].project.id)
  assert.ok(results.some((result) => result.duplicate))
})
