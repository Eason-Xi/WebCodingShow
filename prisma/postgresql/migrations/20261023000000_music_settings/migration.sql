-- CreateTable
CREATE TABLE "MusicSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "autoplay" BOOLEAN NOT NULL DEFAULT false,
    "loopPlaylist" BOOLEAN NOT NULL DEFAULT true,
    "defaultVolume" INTEGER NOT NULL DEFAULT 35,
    "defaultTrackId" TEXT,
    "tracks" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicSettings_pkey" PRIMARY KEY ("id")
);
