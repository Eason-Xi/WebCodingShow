export type MarkdownOutlineItem = {
  level: number
  text: string
  line: number
  offset: number
  sourceLength: number
}

const FENCE_PATTERN = /^\s{0,3}(`{3,}|~{3,})/
const ATX_HEADING_PATTERN = /^\s{0,3}(#{1,6})[\t ]+(.+?)\s*$/
const SETEXT_HEADING_PATTERN = /^\s{0,3}(=+|-+)\s*$/
const CLOSING_HASHES_PATTERN = /[\t ]+#+[\t ]*$/
const IMAGE_PATTERN = /!\[([^\]]*)\]\([^)]*\)/g
const LINK_PATTERN = /\[([^\]]+)\]\([^)]*\)/g
const INLINE_CODE_PATTERN = /`([^`]*)`/g
const HTML_TAG_PATTERN = /<[^>]+>/g
const ESCAPED_MARKDOWN_PATTERN = /\\([\\`*_[\]{}()#+.!~-])/g
const EMPHASIS_MARK_PATTERN = /[*_~]/g

export function markdownHeadingId(line: number): string {
  return `article-heading-${line}`
}

function cleanHeadingText(value: string): string {
  return value
    .replace(CLOSING_HASHES_PATTERN, '')
    .replace(IMAGE_PATTERN, '$1')
    .replace(LINK_PATTERN, '$1')
    .replace(INLINE_CODE_PATTERN, '$1')
    .replace(HTML_TAG_PATTERN, '')
    .replace(ESCAPED_MARKDOWN_PATTERN, '$1')
    .replace(EMPHASIS_MARK_PATTERN, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractMarkdownOutline(markdown: string): MarkdownOutlineItem[] {
  const lines = markdown.split('\n')
  const outline: MarkdownOutlineItem[] = []
  let offset = 0
  let fence: { marker: '`' | '~'; length: number } | null = null

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const fenceMatch = line.match(FENCE_PATTERN)
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as '`' | '~'
      const length = fenceMatch[1].length
      if (!fence) fence = { marker, length }
      else if (fence.marker === marker && length >= fence.length) fence = null
      offset += line.length + 1
      continue
    }

    if (!fence) {
      const atxMatch = line.match(ATX_HEADING_PATTERN)
      if (atxMatch) {
        const text = cleanHeadingText(atxMatch[2])
        if (text) {
          outline.push({
            level: atxMatch[1].length,
            text,
            line: index + 1,
            offset,
            sourceLength: line.length,
          })
        }
      } else if (line.trim()) {
        const underline = lines[index + 1]?.match(SETEXT_HEADING_PATTERN)
        if (underline) {
          const text = cleanHeadingText(line.trim())
          if (text) {
            outline.push({
              level: underline[1][0] === '=' ? 1 : 2,
              text,
              line: index + 1,
              offset,
              sourceLength: line.length,
            })
          }
        }
      }
    }

    offset += line.length + 1
  }

  return outline
}
