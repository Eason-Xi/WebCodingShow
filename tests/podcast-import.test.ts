import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { importPodcast } from '../src/lib/podcast-import'

test('real database: stable feed URLs, repeat sync and repair of legacy signed Muse imports', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'webcoding-podcast-'))
  const databaseUrl = `file:${join(directory, 'test.db')}`
  writeFileSync(join(directory, 'test.db'), '')
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate'], {
    env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'pipe',
  })
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } })
  const original = 'https://muse.ai/podcasts/feed/user/feed'
  const audioUrl = 'https://muse.ai/podcasts/media/user/feed/ep-1.mp3'
  const xml = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
    <title>Show</title><description>News</description><atom:link rel="self" href="${original}"/>
    <item><guid>ep-1</guid><title>Episode</title><enclosure url="${audioUrl}" type="audio/mpeg"/></item>
  </channel></rss>`
  let revision = 0
  const readFeed = async () => ({ url: `https://cdn.fbsbx.com/rss.xml?signature=${++revision}`, status: 200, headers: new Headers(), text: xml })
  try {
    assert.equal((await importPodcast(original, db, readFeed)).added, 1)
    const initial = await db.podcast.findFirstOrThrow({ include: { episodes: true } })
    assert.equal(initial.rssUrl, original)
    assert.equal((await importPodcast(original, db, readFeed)).added, 0)
    assert.equal(await db.podcast.count(), 1)
    assert.equal(await db.podcastEpisode.count(), 1)
    // Simulate a record imported by the previous version, preserving analytics.
    await db.podcast.update({ where: { id: initial.id }, data: { rssUrl: 'https://cdn.fbsbx.com/old.xml?expired=1' } })
    await db.podcastEpisode.update({ where: { id: initial.episodes[0].id }, data: { playCount: 42 } })
    assert.equal((await importPodcast(original, db, readFeed)).added, 0)
    const repaired = await db.podcast.findUniqueOrThrow({ where: { id: initial.id }, include: { episodes: true } })
    assert.equal(repaired.rssUrl, original)
    assert.equal(repaired.episodes[0].id, initial.episodes[0].id)
    assert.equal(repaired.episodes[0].playCount, 42)
    assert.equal(await db.podcast.count(), 1)
    // Feeds without atom:self must retain the original submitted URL as well.
    await importPodcast('https://example.com/rss', db, async () => ({ ...await readFeed(), text: xml.replace(/<atom:link[^>]*\/>/, '').replace('ep-1', 'ep-2') }))
    assert.ok(await db.podcast.findUnique({ where: { rssUrl: 'https://example.com/rss' } }))
  } finally {
    await db.$disconnect()
    rmSync(directory, { recursive: true, force: true })
  }
})
