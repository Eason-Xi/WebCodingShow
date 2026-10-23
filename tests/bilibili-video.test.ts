import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readBilibiliVideoEmbed } from '../src/lib/bilibili-video'

test('builds a non-autoplay Bilibili player URL from article video links', () => {
  const embed = readBilibiliVideoEmbed('https://www.bilibili.com/video/BV1Dxnt6DEJw?p=2&t=60')

  assert.equal(embed?.videoId, 'BV1Dxnt6DEJw')
  assert.equal(embed?.page, 2)
  assert.equal(embed?.sourceUrl, 'https://www.bilibili.com/video/BV1Dxnt6DEJw?p=2&t=60')
  assert.equal(
    embed?.playerUrl,
    'https://player.bilibili.com/player.html?isOutside=true&bvid=BV1Dxnt6DEJw&page=2&high_quality=1&danmaku=0&autoplay=0',
  )
})

test('supports mobile links and legacy av IDs', () => {
  const embed = readBilibiliVideoEmbed('https://m.bilibili.com/video/av123456/')

  assert.equal(embed?.videoId, 'av123456')
  assert.equal(embed?.page, 1)
  assert.match(embed?.playerUrl || '', /[?&]aid=123456(?:&|$)/)
})

test('does not embed unrelated, insecure or malformed links', () => {
  for (const value of [
    'http://www.bilibili.com/video/BV1Dxnt6DEJw',
    'https://bilibili.com.example.com/video/BV1Dxnt6DEJw',
    'https://www.bilibili.com/account/history',
    'https://www.bilibili.com/video/not-a-video',
    'https://user:pass@www.bilibili.com/video/BV1Dxnt6DEJw',
    'not a URL',
    '',
    null,
  ]) assert.equal(readBilibiliVideoEmbed(value), null)
})
