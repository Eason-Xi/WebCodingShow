import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { analyticsDay, analyticsDays, isAnalyticsBot, isAnalyticsOrigin, parseAnalyticsInput, ANALYTICS_WINDOW_MS, type AnalyticsInput } from '../src/lib/analytics-policy'
import { recordAnalytics } from '../src/lib/analytics'

test('analytics validates the content/event matrix and bounded anonymous IDs', () => {
  const input = { contentType: 'post', contentId: 'post-1', visitorId: randomUUID(), event: 'view' }
  assert.deepEqual(parseAnalyticsInput(input), input)
  for (const change of [{ event: ['view'] }, { contentType: ['project'] }, { event: 'play' }, { event: 'videoClick' }, { contentType: 'invalid' }, { contentId: '../evil' }, { contentId: 'x'.repeat(129) }, { visitorId: 'a' }]) {
    assert.equal(parseAnalyticsInput({ ...input, ...change }), null)
  }
  assert.equal(parseAnalyticsInput(null), null)
  assert.equal(parseAnalyticsInput([]), null)
  assert.ok(parseAnalyticsInput({ ...input, contentType: 'episode', event: 'play' }))
  assert.equal(parseAnalyticsInput({ ...input, contentType: 'episode', event: 'experienceClick' }), null)
  assert.ok(isAnalyticsBot('Googlebot/2.1'))
  assert.ok(isAnalyticsBot('facebookexternalhit/1.1'))
  assert.equal(isAnalyticsBot('Mozilla/5.0 Safari/605.1.15'), false)
})

test('analytics days use Taipei midnight, including month/year boundaries', () => {
  assert.equal(analyticsDay(new Date('2026-12-31T15:59:59Z')), '2026-12-31')
  assert.equal(analyticsDay(new Date('2026-12-31T16:00:00Z')), '2027-01-01')
  assert.deepEqual(analyticsDays(new Date('2027-01-01T16:00:00Z'), 3), ['2026-12-31', '2027-01-01', '2027-01-02'])
})

test('browser origins match the public Host, reject cross-site, opaque and malformed origins', () => {
  for (const host of ['localhost:3000', '127.0.0.1:3000', 'portfolio.example']) {
    const origin = `${host.endsWith(':3000') ? 'http' : 'https'}://${host}`
    assert.ok(isAnalyticsOrigin(new Headers({ origin, host })))
    assert.equal(isAnalyticsOrigin(new Headers({ origin, host, 'sec-fetch-site': 'cross-site' })), false)
  }
  for (const origin of ['', 'null', 'https://evil.example', 'http://localhost:4000', 'http://localhost:3000/path', 'ftp://localhost:3000']) {
    assert.equal(isAnalyticsOrigin(new Headers({ origin, host: 'localhost:3000' })), false)
  }
})

test('real database: atomic counters, rolling dedupe, publication rules and daily aggregation', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'webcoding-analytics-'))
  const url = `file:${join(dir, 'test.db')}`
  writeFileSync(join(dir, 'test.db'), '')
  const setup = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8' })
  assert.equal(setup.status, 0, setup.stderr)
  const db = new PrismaClient({ datasources: { db: { url } } })
  try {
    const category = await db.category.create({ data: { name: 'Test', slug: 'test' } })
    const project = await db.project.create({ data: { title: 'Test', slug: 'test', url: 'https://example.com', summary: 'test', categoryId: category.id, videoUrl: 'https://example.com/video' } })
    const post = await db.blogPost.create({ data: { title: 'Test post', slug: 'post', excerpt: 'test', content: 'test', status: 'published' } })
    const draft = await db.blogPost.create({ data: { title: 'Draft', slug: 'draft', excerpt: 'test', content: 'test' } })
    const podcast = await db.podcast.create({ data: { title: 'Show', description: '', rssUrl: 'https://example.com/rss' } })
    const episode = await db.podcastEpisode.create({ data: { podcastId: podcast.id, guid: '1', title: 'Episode', description: '', audioUrl: 'https://example.com/audio.mp3' } })
    const now = new Date('2026-10-28T15:55:00Z')
    const event: AnalyticsInput = { contentType: 'project', contentId: project.id, event: 'view', visitorId: randomUUID() }

    await t.test('concurrent duplicate requests increment only once and preserve edited time', async () => {
      const results = await Promise.all(Array.from({ length: 4 }, () => recordAnalytics(event, db, now)))
      assert.equal(results.filter(r => r === 'counted').length, 1)
      const result = await db.project.findUniqueOrThrow({ where: { id: project.id } })
      assert.equal(result.viewCount, 1)
      assert.equal(result.updatedAt.getTime(), project.updatedAt.getTime())
      assert.equal((await db.contentMetricDay.findFirstOrThrow()).views, 1)
    })
    await t.test('the rolling window spans midnight but expires exactly at 30 minutes', async () => {
      assert.equal(await recordAnalytics(event, db, new Date(now.getTime() + 10 * 60000)), 'duplicate')
      assert.equal(await recordAnalytics(event, db, new Date(now.getTime() + ANALYTICS_WINDOW_MS)), 'counted')
      const days = await db.contentMetricDay.findMany({ where: { contentId: project.id }, orderBy: { day: 'asc' } })
      assert.deepEqual(days.map(d => [d.day, d.views]), [['2026-10-28', 1], ['2026-10-29', 1]])
    })
    await t.test('distinct visitors and event types count independently', async () => {
      const later = new Date(now.getTime() + ANALYTICS_WINDOW_MS)
      const events: AnalyticsInput[] = [
        { ...event, visitorId: randomUUID() },
        { ...event, event: 'videoClick' },
        { ...event, event: 'experienceClick' },
        { ...event, contentType: 'post', contentId: post.id },
        { ...event, contentType: 'episode', contentId: episode.id },
        { ...event, contentType: 'episode', contentId: episode.id, event: 'play' },
      ]
      assert.deepEqual(await Promise.all(events.map(e => recordAnalytics(e, db, later))), Array(6).fill('counted'))
      const result = await db.project.findUniqueOrThrow({ where: { id: project.id } })
      assert.equal(result.viewCount, 3)
      assert.equal(result.videoClickCount, 1)
      assert.equal(result.experienceClickCount, 1)
      assert.equal((await db.blogPost.findUniqueOrThrow({ where: { id: post.id } })).viewCount, 1)
      assert.equal((await db.podcastEpisode.findUniqueOrThrow({ where: { id: episode.id } })).playCount, 1)
      assert.equal(await recordAnalytics(events[5], db, later), 'duplicate')
    })
    await t.test('drafts, missing content and absent video links roll back every write', async () => {
      const receiptsBefore = await db.analyticsReceipt.count()
      for (const id of [draft.id, 'missing']) {
        assert.equal(await recordAnalytics({ ...event, contentType: 'post', contentId: id }, db, new Date(now.getTime() + ANALYTICS_WINDOW_MS)), 'unavailable')
      }
      await db.project.update({ where: { id: project.id }, data: { videoUrl: null } })
      assert.equal(await recordAnalytics({ ...event, event: 'videoClick', visitorId: randomUUID() }, db, new Date(now.getTime() + ANALYTICS_WINDOW_MS)), 'unavailable')
      assert.equal(await db.analyticsReceipt.count(), receiptsBefore)
      assert.equal(await db.contentMetricDay.count({ where: { contentId: draft.id } }), 0)
    })
    await t.test('a failed daily write rolls back the receipt and total counter', async () => {
      await db.$executeRawUnsafe('CREATE TRIGGER reject_metric BEFORE INSERT ON "ContentMetricDay" BEGIN SELECT RAISE(ABORT, \'test failure\'); END')
      const before = await db.blogPost.findUniqueOrThrow({ where: { id: post.id } })
      const receiptsBefore = await db.analyticsReceipt.count()
      await assert.rejects(recordAnalytics({ ...event, contentType: 'post', contentId: post.id, visitorId: randomUUID() }, db, new Date(now.getTime() + ANALYTICS_WINDOW_MS)))
      assert.equal((await db.blogPost.findUniqueOrThrow({ where: { id: post.id } })).viewCount, before.viewCount)
      assert.equal(await db.analyticsReceipt.count(), receiptsBefore)
    })
  } finally {
    await db.$disconnect()
    rmSync(dir, { recursive: true, force: true })
  }
})
