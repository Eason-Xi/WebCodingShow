import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isIP } from 'node:net'
import { isPublicAddress, ProjectImportError, validateProjectUrl } from './project-url'

const MAX_BYTES = 2 * 1024 * 1024

// Resolve, validate and pin the address used by the socket, including every redirect.
// This avoids a second DNS lookup between validation and connection.
export async function fetchPublicText(input: string, options: {
  signal: AbortSignal
  headers?: Record<string, string>
}, redirects = 0): Promise<{ url: string; status: number; headers: Headers; text: string }> {
  options.signal.throwIfAborted()
  const url = validateProjectUrl(input)
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  let addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await new Promise<Awaited<ReturnType<typeof resolveAddresses>>>((resolve, reject) => {
      const abort = () => reject(options.signal.reason)
      options.signal.addEventListener('abort', abort, { once: true })
      resolveAddresses(hostname).then(resolve, reject)
        .finally(() => options.signal.removeEventListener('abort', abort))
    })
  options.signal.throwIfAborted()
  // Some desktop proxies return benchmark-range "fake IPs" for every public name.
  // Resolve those names through a fixed public DoH endpoint instead of allowing
  // connections to reserved addresses. The resulting IP is still checked and pinned.
  if (!isIP(hostname) && addresses.length && addresses.every(({ address }) => /^198\.(18|19)\./.test(address))) {
    const dns = await fetchPublicText(`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      signal: options.signal, headers: { Accept: 'application/dns-json' },
    })
    if (dns.status !== 200) throw new ProjectImportError('域名解析失败，请稍后重试', 502)
    const answer = JSON.parse(dns.text) as { Status: number; Answer?: { type: number; data: string }[] }
    addresses = answer.Status === 0
      ? (answer.Answer || []).filter((item) => item.type === 1 && isIP(item.data) === 4).map((item) => ({ address: item.data, family: 4 }))
      : []
  }
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ProjectImportError('此地址指向本机或内网，无法导入')
  }
  const address = addresses.find((item) => item.family === 4) || addresses[0]
  const result = await new Promise<{ status: number; headers: Headers; text: string }>((resolve, reject) => {
    const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(url, {
      method: 'GET',
      signal: options.signal,
      agent: false,
      headers: { 'User-Agent': 'WebCodingShow', Accept: 'text/html', 'Accept-Encoding': 'identity', ...options.headers },
      // TLS still validates the original hostname; only the network address is pinned.
      lookup: (_hostname, lookupOptions, callback) => {
        if (lookupOptions.all) callback(null, [address])
        else callback(null, address.address, address.family)
      },
    }, (response) => {
      const headers = new Headers()
      for (const [key, value] of Object.entries(response.headers)) {
        if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
      }
      const status = response.statusCode || 502
      if (status >= 300 && status < 400 && headers.has('location')) {
        response.destroy()
        resolve({ status, headers, text: '' })
        return
      }
      if (Number(headers.get('content-length')) > MAX_BYTES) {
        response.destroy()
        reject(new ProjectImportError('页面内容过大，请使用项目首页或 GitHub 仓库地址', 502))
        return
      }
      let size = 0
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > MAX_BYTES) {
          response.destroy(new ProjectImportError('页面内容过大，无法提取', 502))
        } else chunks.push(chunk)
      })
      response.on('error', reject)
      response.on('end', () => resolve({ status, headers, text: Buffer.concat(chunks).toString('utf8') }))
    })
    request.on('error', reject)
    request.end()
  })
  if (result.status >= 300 && result.status < 400 && result.headers.has('location')) {
    if (redirects >= 4) throw new ProjectImportError('网页重定向次数过多', 502)
    const next = new URL(result.headers.get('location')!, url)
    const headers = { ...options.headers }
    if (next.origin !== url.origin) {
      for (const key of Object.keys(headers)) {
        if (/^(authorization|cookie)$/i.test(key)) delete headers[key]
      }
    }
    return fetchPublicText(next.toString(), { ...options, headers }, redirects + 1)
  }
  return { ...result, url: url.toString() }
}

function resolveAddresses(hostname: string) {
  return lookup(hostname, { all: true })
}
