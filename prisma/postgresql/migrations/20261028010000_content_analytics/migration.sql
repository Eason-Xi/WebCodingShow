ALTER TABLE "Project" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "videoClickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "experienceClickCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BlogPost" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PodcastEpisode" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "playCount" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "ContentMetricDay" (
  "contentType" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "plays" INTEGER NOT NULL DEFAULT 0,
  "videoClicks" INTEGER NOT NULL DEFAULT 0,
  "experienceClicks" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ContentMetricDay_pkey" PRIMARY KEY ("contentType", "contentId", "day")
);
CREATE INDEX "ContentMetricDay_day_idx" ON "ContentMetricDay"("day");
CREATE TABLE "AnalyticsReceipt" (
  "id" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnalyticsReceipt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AnalyticsReceipt_expiresAt_idx" ON "AnalyticsReceipt"("expiresAt");
