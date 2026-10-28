CREATE TABLE "Podcast" (
 "id" TEXT NOT NULL PRIMARY KEY, "rssUrl" TEXT NOT NULL, "title" TEXT NOT NULL,
 "description" TEXT NOT NULL, "author" TEXT, "cover" TEXT, "website" TEXT,
 "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Podcast_rssUrl_key" ON "Podcast"("rssUrl");
CREATE TABLE "PodcastEpisode" (
 "id" TEXT NOT NULL PRIMARY KEY, "podcastId" TEXT NOT NULL, "guid" TEXT NOT NULL,
 "title" TEXT NOT NULL, "description" TEXT NOT NULL, "audioUrl" TEXT NOT NULL,
 "cover" TEXT, "duration" INTEGER, "publishedAt" TIMESTAMP(3), "website" TEXT,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_guid_key" ON "PodcastEpisode"("podcastId", "guid");
CREATE INDEX "PodcastEpisode_publishedAt_idx" ON "PodcastEpisode"("publishedAt");
