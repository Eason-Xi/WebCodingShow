import { spawnSync } from 'node:child_process'

for (const key of ['DATABASE_URL', 'DIRECT_URL', 'BLOB_READ_WRITE_TOKEN', 'ADMIN_PASSWORD', 'JWT_SECRET']) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`)
}
if (process.env.ADMIN_PASSWORD.length < 12 || process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET === 'web-coding-platform-super-secret-key-2026') {
  throw new Error('Use a unique ADMIN_PASSWORD (12+ characters) and JWT_SECRET (32+ characters)')
}
for (const args of [
  ['scripts/prisma.mjs', 'generate'],
  ['scripts/prisma.mjs', 'migrate', 'deploy'],
  ['node_modules/next/dist/bin/next', 'build'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
