import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'

loadEnvConfig(process.cwd())
const prisma = new PrismaClient()
const url = 'https://www.bilibili.com/video/BV1t7HN6QErA/'

async function main() {
  const existing = await prisma.project.findFirst({ where: { OR: [{ url }, { videoUrl: url }, { slug: 'video-bv1t7hn6qera' }] } })
  if (existing) { console.log('测试视频已存在，保留现有编辑内容。'); return }
  const category = await prisma.category.upsert({
    where: { slug: 'video-creation' }, update: {}, create: { name: '影像创作', slug: 'video-creation', sortOrder: 0 },
  })
  await prisma.project.create({ data: {
    title: '手搓475W桌面快充站，每一路都可满速，不高温不降功率，支持pd协议有伸缩性还有dc供电！',
    slug: 'video-bv1t7hn6qera', url, videoUrl: url, categoryId: category.id,
    cover: '/images/videos/BV1t7HN6QErA.jpg',
    summary: '创作者：方阿成。从想法到实物，记录一台 475W 桌面快充站的制作，探索多路快充与 DC 供电。',
    description: '用户指定的影像展示测试作品。原视频由 B 站创作者「方阿成」发布，点击封面前往原视频观看。',
    status: 'published', featured: false,
  } })
  console.log('已添加 B 站测试视频，可在 /videos 查看。')
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
