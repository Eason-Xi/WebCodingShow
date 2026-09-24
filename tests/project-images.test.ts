import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeProjectImages, readProjectImages, projectGallery, MAX_PROJECT_IMAGES } from '../src/lib/project-images'

test('project galleries preserve order, deduplicate cover, and handle legacy projects', () => {
  const images = normalizeProjectImages([' https://example.com/one.png ', '/api/uploads/two.png', 'https://example.com/one.png'])
  assert.deepEqual(images, ['https://example.com/one.png', '/api/uploads/two.png'])
  assert.deepEqual(projectGallery(images[0], JSON.stringify(images)), images)
  assert.deepEqual(projectGallery('/uploads/old.png'), ['/uploads/old.png'])
  assert.deepEqual(projectGallery(null, JSON.stringify(images)), images)
  assert.deepEqual(readProjectImages('invalid'), [])
  assert.deepEqual(readProjectImages(null), [])
})

test('gallery writes reject temporary, executable, malformed and oversized image lists', () => {
  for (const value of [null, '[]', {}, ['blob:https://example.com/id'], ['javascript:alert(1)'], ['data:image/png;base64,a'], ['//example.com/a.png'], [42], ['https://user:pass@example.com/a.png'], Array(MAX_PROJECT_IMAGES + 1).fill('https://example.com/one.png')]) {
    assert.throws(() => normalizeProjectImages(value))
  }
  assert.deepEqual(normalizeProjectImages([]), [])
})
