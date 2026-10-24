import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractMarkdownOutline } from '../src/lib/markdown-outline'

test('extracts ATX and setext headings with line and selection positions', () => {
  const markdown = [
    '# 开场',
    '',
    '正文',
    '',
    '第二章',
    '------',
    '',
    '### [链接标题](https://example.com) `code` ###',
  ].join('\n')

  assert.deepEqual(extractMarkdownOutline(markdown), [
    { level: 1, text: '开场', line: 1, offset: 0, sourceLength: 4 },
    { level: 2, text: '第二章', line: 5, offset: 10, sourceLength: 3 },
    { level: 3, text: '链接标题 code', line: 8, offset: 22, sourceLength: 42 },
  ])
})

test('ignores heading-like text inside code fences and blockquotes', () => {
  const markdown = [
    '```md',
    '# 代码里的标题',
    '```',
    '',
    '> # 引用里的标题',
    '',
    '## 正文标题',
    '',
    '~~~~',
    '### 另一个代码标题',
    '~~~~',
  ].join('\n')

  assert.deepEqual(extractMarkdownOutline(markdown).map(({ level, text, line }) => ({ level, text, line })), [
    { level: 2, text: '正文标题', line: 7 },
  ])
})

test('returns an empty outline when the article has no headings', () => {
  assert.deepEqual(extractMarkdownOutline('只有正文。\n\n- 列表项'), [])
})
