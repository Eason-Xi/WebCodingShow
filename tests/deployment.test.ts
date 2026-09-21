import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHmac } from 'node:crypto'
import { createSessionToken, verifySessionToken, checkAdminPassword } from '../src/lib/auth'
import { validateImage, MAX_IMAGE_BYTES } from '../src/lib/upload-policy'
import { normalizeAvatar, ProfileValidationError } from '../src/lib/profile'
import {
  buildGitHubProjectMetadata,
  extractReadmeSummary,
  parseGitHubRepositoryUrl,
  parseGitHubPageMetadata,
} from '../src/lib/github-metadata'

test('session signatures reject tampering, expiry, extra segments and missing secrets', async () => {
  process.env.JWT_SECRET = 'test-only-random-secret-with-at-least-32-characters'
  const token = await createSessionToken()
  assert.equal(await verifySessionToken(token), true)
  assert.equal(await verifySessionToken(`${token}.extra`), false)
  assert.equal(await verifySessionToken(`changed.${token.split('.')[1]}`), false)
  const expired = Buffer.from(JSON.stringify({ role: 'admin', exp: 1 })).toString('base64url')
  const signature = createHmac('sha256', process.env.JWT_SECRET).update(expired).digest('base64url')
  assert.equal(await verifySessionToken(`${expired}.${signature}`), false)
  delete process.env.JWT_SECRET
  assert.equal(await verifySessionToken(token), false)
  await assert.rejects(createSessionToken())
})

test('production rejects default credentials and accepts configured credentials', async () => {
  const original = process.env.NODE_ENV
  Object.assign(process.env, { NODE_ENV: 'production', ADMIN_PASSWORD: 'admin123' })
  await assert.rejects(checkAdminPassword('admin123'))
  process.env.ADMIN_PASSWORD = 'unique-test-password-123'
  assert.equal(await checkAdminPassword('wrong'), false)
  assert.equal(await checkAdminPassword('unique-test-password-123'), true)
  process.env.JWT_SECRET = 'web-coding-platform-super-secret-key-2026'
  await assert.rejects(createSessionToken())
  if (original === undefined) Reflect.deleteProperty(process.env, 'NODE_ENV')
  else Object.assign(process.env, { NODE_ENV: original })
})

test('uploads reject executable SVGs, unknown types, empty and oversized files', () => {
  for (const type of ['image/svg+xml', 'text/html', 'application/octet-stream']) {
    assert.ok(validateImage({ type, size: 100 }))
  }
  assert.ok(validateImage({ type: 'image/png', size: 0 }))
  assert.ok(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 }))
  assert.equal(validateImage({ type: 'image/png', size: MAX_IMAGE_BYTES }), null)
})

test('profile rejects browser-local avatar URLs', () => {
  assert.equal(normalizeAvatar(undefined), undefined)
  assert.equal(normalizeAvatar(''), null)
  assert.equal(normalizeAvatar('/api/uploads/avatar.png'), '/api/uploads/avatar.png')
  assert.equal(normalizeAvatar('https://example.com/avatar.png'), 'https://example.com/avatar.png')
  assert.throws(
    () => normalizeAvatar('blob:https://example.com/browser-session-id'),
    ProfileValidationError,
  )
})

test('GitHub repository metadata fills tags and extended project fields', () => {
  const repository = parseGitHubRepositoryUrl('https://github.com/Eason-Xi/WebCodingShow.git/tree/main')
  assert.deepEqual(repository, {
    owner: 'Eason-Xi',
    repo: 'WebCodingShow',
    url: 'https://github.com/Eason-Xi/WebCodingShow',
  })
  assert.equal(parseGitHubRepositoryUrl('https://github.com/settings/profile'), null)
  assert.equal(parseGitHubRepositoryUrl('https://gitlab.com/Eason-Xi/WebCodingShow'), null)
  assert.equal(parseGitHubRepositoryUrl('https://github.com.evil.test/owner/repo'), null)
  assert.equal(parseGitHubRepositoryUrl('ftp://github.com/owner/repo'), null)

  const readme = '# WebCodingShow\n\n![badge](badge.svg)\n\nA portfolio platform for modern web projects and creative coding experiments.'
  assert.equal(
    extractReadmeSummary(readme),
    'A portfolio platform for modern web projects and creative coding experiments.',
  )

  const metadata = buildGitHubProjectMetadata(repository!, {
    name: 'WebCodingShow',
    full_name: 'Eason-Xi/WebCodingShow',
    html_url: repository!.url,
    homepage: 'https://portfolio.example.com',
    description: 'A curated Web project portfolio.',
    topics: ['nextjs', 'portfolio'],
    language: 'TypeScript',
    pushed_at: '2026-09-21T08:00:00Z',
    stargazers_count: 12,
    forks_count: 3,
    license: { spdx_id: 'MIT' },
  }, { TypeScript: 900, CSS: 100 }, readme)

  assert.equal(metadata.url, 'https://portfolio.example.com/')
  assert.equal(metadata.sourceUrl, repository!.url)
  assert.equal(metadata.completedAt, '2026-09')
  assert.deepEqual(metadata.tags, ['nextjs', 'portfolio', 'TypeScript', 'CSS'])
  assert.match(metadata.description, /主要技术：TypeScript、CSS/)
})

test('GitHub metadata tolerates missing optional data and deduplicates tags', () => {
  const ref = { owner: 'example', repo: 'demo', url: 'https://github.com/example/demo' }
  const metadata = buildGitHubProjectMetadata(ref, {
    name: 'demo', full_name: 'example/demo', html_url: ref.url,
    language: 'TypeScript', topics: ['typescript', 'web'], homepage: 'javascript:alert(1)',
  }, {}, '')
  assert.deepEqual(metadata.tags, ['typescript', 'web'])
  assert.equal(metadata.url, ref.url)
  assert.equal(metadata.completedAt, '')
  assert.ok(metadata.summary)
  assert.ok(metadata.description)
})

test('SQLite and PostgreSQL models remain identical', () => {
  const models = (file: string) => readFileSync(file, 'utf8').split('model Profile')[1]
    .replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '')
  assert.equal(models('prisma/schema.prisma'), models('prisma/postgresql/schema.prisma'))
})

test('public GitHub page fallback extracts README, homepage and technology tags without inventing a date', () => {
  const ref = { owner: 'example', repo: 'demo', url: 'https://github.com/example/demo' }
  const payload = {
    codeViewLayoutRoute: { repo: { name: 'demo', ownerLogin: 'example' } },
    codeViewRepoRoute: { overview: { overviewFiles: [{
      preferredFileType: 'readme',
      richText: '<h1>A very long heading that should not become the summary</h1><p>A portfolio built with Next.js &amp; React for creative web projects.</p><pre>ignored code</pre><p>TypeScript and Prisma</p>',
    }] } },
    sidebarAbout: { website: 'https://demo.example.com', topics: ['portfolio'], stargazerCount: 4 },
  }
  const result = parseGitHubPageMetadata(ref, `<script type="application/json">invalid</script><script type="application/json">${JSON.stringify({ payload })}</script>`)
  assert.equal(result?.url, 'https://demo.example.com/')
  assert.equal(result?.summary, 'A portfolio built with Next.js & React for creative web projects.')
  assert.deepEqual(result?.tags, ['portfolio', 'TypeScript', 'React', 'Next.js', 'Prisma'])
  assert.equal(result?.completedAt, '')
  assert.equal(parseGitHubPageMetadata(ref, '<html>Sign in</html>'), null)
})
