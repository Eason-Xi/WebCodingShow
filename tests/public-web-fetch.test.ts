import { test, type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import dns from 'node:dns/promises'
import https from 'node:https'
import { PassThrough } from 'node:stream'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, RequestOptions } from 'node:http'
import { fetchPublicHeaders, fetchPublicText } from '../src/lib/public-web-fetch'

type Reply = { status?: number; headers?: Record<string, string>; body?: string }
type Call = { url: URL; options: RequestOptions }

function mockNetwork(context: TestContext, reply: (url: URL) => Reply, address = '8.8.8.8') {
  const calls: Call[] = []
  context.mock.method(dns, 'lookup', async () => [{ address, family: 4 }])
  context.mock.method(https, 'request', (url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void) => {
    calls.push({ url, options })
    const request = new EventEmitter() as EventEmitter & { end: () => void }
    request.end = () => queueMicrotask(() => {
      const data = reply(url)
      const response = new PassThrough() as unknown as IncomingMessage
      response.statusCode = data.status ?? 200
      response.headers = data.headers || {}
      callback(response)
      if (!response.destroyed) (response as unknown as PassThrough).end(data.body || '')
    })
    return request
  })
  return calls
}

test('every redirect is checked, and credentials are stripped when the origin changes', async (context) => {
  const calls = mockNetwork(context, (url) => url.hostname === 'first.example.com'
    ? { status: 302, headers: { location: 'https://second.example.com/page' } }
    : { body: 'page content' })
  const response = await fetchPublicText('https://first.example.com', {
    signal: AbortSignal.timeout(1000), headers: { Authorization: 'test-only-token' },
  })
  assert.equal(response.url, 'https://second.example.com/page')
  assert.equal(response.text, 'page content')
  assert.equal((calls[0].options.headers as Record<string, string>).Authorization, 'test-only-token')
  assert.equal((calls[1].options.headers as Record<string, string>).Authorization, undefined)
  assert.equal(calls[1].options.agent, false)
  assert.ok(calls[1].options.lookup)
})

test('redirects cannot reach loopback addresses and redirect loops are bounded', async (context) => {
  const calls = mockNetwork(context, () => ({ status: 302, headers: { location: 'http://127.0.0.1/admin' } }))
  await assert.rejects(fetchPublicText('https://example.com', { signal: AbortSignal.timeout(1000) }), /本机|内网/)
  assert.equal(calls.length, 1)
  context.mock.restoreAll()
  const loop = mockNetwork(context, () => ({ status: 302, headers: { location: '/loop' } }))
  await assert.rejects(fetchPublicText('https://example.com', { signal: AbortSignal.timeout(1000) }), /重定向次数/)
  assert.equal(loop.length, 5)
})

test('oversized bodies are rejected even without a content-length header', async (context) => {
  mockNetwork(context, () => ({ body: 'x'.repeat(2 * 1024 * 1024 + 1) }))
  await assert.rejects(fetchPublicText('https://example.com', { signal: AbortSignal.timeout(1000) }), /内容过大/)
})

test('fake DNS is resolved publicly and the actual address is pinned to the socket', async (context) => {
  const calls = mockNetwork(context, (url) => url.hostname === '1.1.1.1'
    ? { body: JSON.stringify({ Status: 0, Answer: [{ type: 1, data: '8.8.4.4' }] }) }
    : { body: 'public content' }, '198.19.0.33')
  const response = await fetchPublicText('https://example.com', { signal: AbortSignal.timeout(1000) })
  assert.equal(response.text, 'public content')
  assert.equal(calls[0].url.hostname, '1.1.1.1')
  const lookup = calls[1].options.lookup!
  await new Promise<void>((resolve) => lookup('example.com', { all: true }, (error, addresses) => {
    assert.equal(error, null)
    assert.deepEqual(addresses, [{ address: '8.8.4.4', family: 4 }])
    resolve()
  }))
})

test('private DNS answers stay blocked, including answers returned by the fake DNS fallback', async (context) => {
  const calls = mockNetwork(context, () => ({}), '10.0.0.1')
  await assert.rejects(fetchPublicText('https://example.com', { signal: AbortSignal.timeout(1000) }), /内网/)
  assert.equal(calls.length, 0)
  context.mock.restoreAll()
  const fallback = mockNetwork(context, () => ({ body: JSON.stringify({ Status: 0, Answer: [{ type: 1, data: '127.0.0.1' }] }) }), '198.18.0.1')
  await assert.rejects(fetchPublicText('https://example.com', { signal: AbortSignal.timeout(1000) }), /内网/)
  assert.equal(fallback.length, 1)
})

test('media HEAD resolves redirects without buffering large audio, while keeping network checks', async (context) => {
  const calls = mockNetwork(context, (url): Reply => url.hostname === 'muse.ai'
    ? { status: 302, headers: { location: 'https://cdn.example.com/audio.mp3', 'cross-origin-resource-policy': 'same-origin' } }
    : { headers: { 'content-type': 'audio/mpeg', 'content-length': '3102949' } })
  const response = await fetchPublicHeaders('https://muse.ai/audio.mp3', { signal: AbortSignal.timeout(1000) })
  assert.equal(response.url, 'https://cdn.example.com/audio.mp3')
  assert.equal(response.headers.get('content-type'), 'audio/mpeg')
  assert.equal(response.text, '')
  assert.deepEqual(calls.map(call => call.options.method), ['HEAD', 'HEAD'])
  context.mock.restoreAll()
  const blocked = mockNetwork(context, () => ({ status: 302, headers: { location: 'http://127.0.0.1/audio.mp3' } }))
  await assert.rejects(fetchPublicHeaders('https://muse.ai/audio.mp3', { signal: AbortSignal.timeout(1000) }), /本机|内网/)
  assert.equal(blocked.length, 1)
})
