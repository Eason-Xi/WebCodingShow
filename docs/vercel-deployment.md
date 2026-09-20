# Vercel deployment

GitHub: `Eason-Xi/WebCodingShow`, production branch: `main`.
Vercel project: `xishis-projects/webcoding-show`.

## Cloud resources and environment

Connect a Neon PostgreSQL database and a **public** Vercel Blob store from the project's Storage page. Set these variables for the deployment environment:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL URL from Neon |
| `DIRECT_URL` | Direct/unpooled PostgreSQL URL from Neon (often supplied as `DATABASE_URL_UNPOOLED`) |
| `BLOB_READ_WRITE_TOKEN` | Automatically supplied when the Blob store is connected |
| `ADMIN_PASSWORD` | Unique password, at least 12 characters |
| `JWT_SECRET` | Random secret, at least 32 characters |

Never put credentials in Git. Preview deployments should use a separate database or Neon branch, not the production database.

`vercel.json` selects `npm run vercel-build`, which validates configuration, regenerates Prisma Client, applies committed PostgreSQL migrations, then builds Next.js. Seeds are deliberately **not** run on deploy. Migrations are forward-only; reverting an app deployment does not revert the database.

## Preserve existing local content

1. With the original SQLite `.env` active, run `npm run db:generate` then `npm run data:export`. The ignored, private `backups/portfolio.json` includes all projects, categories, tags and profile data. Existing backups are never overwritten.
2. Pull cloud environment variables with `vercel env pull .env.local --environment=production`. Verify `DIRECT_URL` is present; map it from the unpooled Neon URL if needed.
3. Run `npm run db:generate`, then `npm run db:migrate` against the confirmed target database.
4. Run `npm run data:import`. The importer requires an empty PostgreSQL database and preserves IDs and tag relationships. Existing local images are uploaded to Blob and their URLs rewritten. Database inserts are atomic; a Blob transfer report is saved under `backups/` for recovery if the import fails.
5. Verify row counts, cover images, login and an upload before promoting a preview to production.

For a fresh demonstration database, `npm run db:seed` is an alternative to importing. It changes demo records, so do not run it against populated production data.

## Local development

SQLite remains supported using `DATABASE_URL="file:./dev.db"` in `.env`. `.env.local` takes priority; move the cloud environment file aside before returning to SQLite. Run `npm run db:generate` after switching database providers, then restart the app. Keep models in `prisma/schema.prisma` and `prisma/postgresql/schema.prisma` identical; `npm test` verifies parity.

Uploads use Blob whenever its token is set. Without it, local development saves to `public/uploads`; Vercel returns a configuration error instead of writing ephemeral files. Accepted image formats are PNG, JPEG, WebP and GIF, up to 4 MiB. This leaves room below Vercel's 4.5 MB request limit.

## Verification

Run `npm test`, `npx tsc --noEmit`, and `npm run build`.
Test anonymous `/api/projects?status=all` and `/api/projects?status=draft`: both must only return published projects. Anonymous access to a draft ID must return 404. Authenticated administrators can still see drafts.

The old `/uploads/` and `/api/uploads/` handlers remain for local compatibility; local files must be transferred before deploying because they are excluded from Git.
