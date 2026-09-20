import nextEnv from '@next/env'
import { spawnSync } from 'node:child_process'

nextEnv.loadEnvConfig(process.cwd())
const postgres = /^postgres(ql)?:/.test(process.env.DATABASE_URL || '')
if (process.env.VERCEL && !postgres) {
  throw new Error('Vercel requires a PostgreSQL DATABASE_URL')
}
if (postgres && !process.env.DIRECT_URL) {
  throw new Error('Set DIRECT_URL to the unpooled PostgreSQL connection string')
}
const schema = postgres ? 'prisma/postgresql/schema.prisma' : 'prisma/schema.prisma'
const result = spawnSync(process.execPath, [
  'node_modules/prisma/build/index.js', ...process.argv.slice(2), '--schema', schema,
], { stdio: 'inherit', env: process.env })
process.exit(result.status ?? 1)
