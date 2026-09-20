CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE "Profile" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "name" TEXT NOT NULL DEFAULT 'Web 独立开发者',
  "title" TEXT NOT NULL DEFAULT 'Full-Stack Developer & Creative Coder',
  "bio" TEXT NOT NULL DEFAULT '致力于构建高可用、具美感且充满想象力的现代 Web 与 AI 产品。',
  "avatar" TEXT, "githubUrl" TEXT, "xUrl" TEXT, "email" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Category" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Tag" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Project" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "url" TEXT NOT NULL, "cover" TEXT, "summary" TEXT NOT NULL,
  "description" TEXT, "categoryId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'published',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "sourceUrl" TEXT, "completedAt" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "_ProjectToTag" (
  "A" TEXT NOT NULL, "B" TEXT NOT NULL,
  CONSTRAINT "_ProjectToTag_AB_pkey" PRIMARY KEY ("A", "B")
);
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");
CREATE INDEX "_ProjectToTag_B_index" ON "_ProjectToTag"("B");
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProjectToTag" ADD CONSTRAINT "_ProjectToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProjectToTag" ADD CONSTRAINT "_ProjectToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
