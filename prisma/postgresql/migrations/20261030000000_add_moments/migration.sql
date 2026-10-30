CREATE TABLE "Moment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "xUrl" TEXT,
    "xhsUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Moment_status_pinned_publishedAt_idx" ON "Moment"("status", "pinned", "publishedAt" DESC);
