import { test } from 'node:test'
import assert from 'node:assert/strict'
import dns from 'node:dns/promises'
import https from 'node:https'
import { PassThrough } from 'node:stream'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, RequestOptions } from 'node:http'
import { prisma } from '../src/lib/prisma'
import { GET } from '../src/app/api/podcasts/episodes/[id]/audio/route'

test('audio resolver uses only stored episode sources, validates redirects and never caches signed URLs', async context => {
  const findUnique = prisma.podcastEpisode.findUnique
  prisma.podcastEpisode.findUnique = (async ({ where }: { where: { id: string } }) => where.id === 'missing' ? null : { audioUrl: 'https://muse.ai/podcasts/media/user/feed/ep.mp3' }) as unknown as typeof findUnique
  context.after(() => { prisma.podcastEpisode.findUnique = findUnique })
  context.mock.method(dns, 'lookup', async () => [{ address: '8.8.8.8', family: 4 }])
  let target = 'https://cdn.example.com/audio.mp3?signature=fresh'
  let status = 200
  let contentType = 'audio/mpeg'
  const calls: { url: URL; method: string | undefined }[] = []
  context.mock.method(https, 'request', (url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void) => {
    calls.push({ url, method: options.method })
    const request = new EventEmitter() as EventEmitter & { end: () => void }
    request.end = () => queueMicrotask(() => {
      const response = new PassThrough() as unknown as IncomingMessage
      response.statusCode = url.hostname === 'muse.ai' ? 302 : status
      response.headers = url.hostname === 'muse.ai'
        ? { location: target, 'cross-origin-resource-policy': 'same-origin' }
        : { 'content-type': contentType, 'content-length': '3102949', 'cross-origin-resource-policy': 'cross-origin' }
      callback(response)
      if (!response.destroyed) (response as unknown as PassThrough).end()
    })
    return request
  })
  const get = (id = 'ep-1') => GET(new Request(`https://site.example.com/api/podcasts/episodes/${id}/audio?url=http://127.0.0.1`), { params: Promise.resolve({ id }) })
  assert.equal((await get('missing')).status, 404)
  assert.equal(calls.length, 0)
  const response = await get()
  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), target)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.deepEqual(calls.map(call => call.method), ['HEAD', 'HEAD'])
  status = 403
  assert.equal((await get()).status, 502)
  status = 200
  contentType = 'text/html'
  assert.equal((await get()).status, 502)
  target = 'http://127.0.0.1/private'
  const blocked = await get()
  assert.equal(blocked.status, 502)
  assert.equal(calls.some(call => call.url.hostname === '127.0.0.1'), false)
})
