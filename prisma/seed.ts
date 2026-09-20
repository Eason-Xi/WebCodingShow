import { PrismaClient } from '@prisma/client'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始播种数据库初始数据...')

  // 1. 初始化或更新 Profile
  await prisma.profile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Web 独立创作者',
      title: 'Senior Web Engineer & Creative Coder',
      bio: '致力于通过极简设计与工程工程实践，构建具有美感、极致交互与实用价值的现代 Web & AI 作品集合。',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      githubUrl: 'https://github.com',
      xUrl: 'https://x.com',
      email: 'creator@example.com',
    },
  })

  // 2. 初始化分类
  const categoriesData = [
    { name: 'AI 应用', slug: 'ai-apps', sortOrder: 100 },
    { name: '效率工具', slug: 'tools', sortOrder: 90 },
    { name: '数据可视化', slug: 'data-viz', sortOrder: 80 },
    { name: '创意交互', slug: 'creative', sortOrder: 70 },
    { name: '小游戏', slug: 'games', sortOrder: 60 },
    { name: '实验项目', slug: 'experiments', sortOrder: 50 },
  ]

  const categoriesMap: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    })
    categoriesMap[cat.slug] = created.id
  }

  // 3. 初始化标签
  const tagsData = [
    { name: 'React', slug: 'react' },
    { name: 'Next.js', slug: 'nextjs' },
    { name: 'Three.js', slug: 'threejs' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Tailwind CSS', slug: 'tailwindcss' },
    { name: 'AI Agent', slug: 'ai-agent' },
    { name: 'WebGL', slug: 'webgl' },
    { name: 'Canvas', slug: 'canvas' },
    { name: 'D3.js', slug: 'd3js' },
    { name: 'LLM', slug: 'llm' },
  ]

  for (const t of tagsData) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      update: { name: t.name },
      create: t,
    })
  }

  // 4. 初始化精选与常规项目
  const projectsData = [
    {
      title: 'AI Prompt Studio Pro',
      slug: 'ai-prompt-studio',
      url: 'https://github.com/trending',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      summary: '专为提示词工程师设计的模块化调试工作台，支持多模型对比与版本追溯。',
      description: '采用流式响应与本地工作区持久化架构，内置数百种高频 Prompt 模板与评估对比视图。',
      categoryId: categoriesMap['ai-apps'],
      status: 'published',
      featured: true,
      sortOrder: 100,
      sourceUrl: 'https://github.com',
      completedAt: '2026-08',
      tagSlugs: ['nextjs', 'ai-agent', 'typescript', 'tailwindcss'],
    },
    {
      title: 'Shader Flow 3D 交互画廊',
      slug: 'shader-flow-gallery',
      url: 'https://threejs.org',
      cover: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80',
      summary: '基于 GLSL 着色器与 WebGL 的数字波纹流体动态艺术生成器。',
      description: '探索 GPU 实时计算的流体碰撞动效，支持参数化导出高清视频与交互体验。',
      categoryId: categoriesMap['creative'],
      status: 'published',
      featured: true,
      sortOrder: 95,
      sourceUrl: 'https://github.com',
      completedAt: '2026-07',
      tagSlugs: ['threejs', 'webgl', 'typescript'],
    },
    {
      title: 'DevPulse 开发者时钟仪表板',
      slug: 'devpulse-dashboard',
      url: 'https://github.com',
      cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      summary: '沉浸式全屏番茄钟与研发节奏监控平台，支持集成 GitHub Commits 动态。',
      description: '轻量零干扰的桌面辅助效率工具，提供专注声音矩阵与统计图表。',
      categoryId: categoriesMap['tools'],
      status: 'published',
      featured: true,
      sortOrder: 90,
      sourceUrl: 'https://github.com',
      completedAt: '2026-06',
      tagSlugs: ['react', 'tailwindcss', 'd3js'],
    },
    {
      title: 'GeoGraph 全球网络延迟热力图',
      slug: 'geograph-latency-map',
      url: 'https://d3js.org',
      cover: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80',
      summary: '实时多节点全球网络连通性与丢包率三维地球投影可视化方案。',
      description: '基于 D3.js 与 Canvas 混合渲染技术，每秒处理千万级模拟网络节点心跳。',
      categoryId: categoriesMap['data-viz'],
      status: 'published',
      featured: true,
      sortOrder: 85,
      sourceUrl: 'https://github.com',
      completedAt: '2026-05',
      tagSlugs: ['d3js', 'canvas', 'typescript'],
    },
    {
      title: 'Pixel Odyssey 8-Bit 复古地牢',
      slug: 'pixel-odyssey-dungeon',
      url: 'https://itch.io',
      cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      summary: '纯 HTML5 Canvas 驱动的复古像素 Rogue-like 动作探索网页小游戏。',
      description: '自研轻量 AABB 碰撞引擎与程序化地牢随机生成算法，零外部大型重依赖。',
      categoryId: categoriesMap['games'],
      status: 'published',
      featured: false,
      sortOrder: 80,
      sourceUrl: 'https://github.com',
      completedAt: '2026-04',
      tagSlugs: ['canvas', 'typescript'],
    },
    {
      title: 'Neural Scribe 智能语法精修台',
      slug: 'neural-scribe-editor',
      url: 'https://openai.com',
      cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      summary: '支持本地离线分词与大模型混合驱动的技术文档风格纠错增强编辑器。',
      description: '采用 ProseMirror 架构深度定制富文本，支持多维度的技术术语一致性排查。',
      categoryId: categoriesMap['ai-apps'],
      status: 'published',
      featured: true,
      sortOrder: 75,
      sourceUrl: 'https://github.com',
      completedAt: '2026-03',
      tagSlugs: ['llm', 'react', 'nextjs'],
    },
    {
      title: 'AudioSpectra 实时音频频谱生成器',
      slug: 'audio-spectra-visualizer',
      url: 'https://webaudioapi.com',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
      summary: '基于 Web Audio API 的音频频段动态可视化分析与粒子律动系统。',
      description: '接入麦克风或本地音乐文件，实时提取 FFT 频段并映射到 WebGL 粒子场。',
      categoryId: categoriesMap['experiments'],
      status: 'published',
      featured: false,
      sortOrder: 70,
      sourceUrl: 'https://github.com',
      completedAt: '2026-02',
      tagSlugs: ['webgl', 'threejs', 'canvas'],
    },
    {
      title: 'CSS Glassmorphism 拟态生成器',
      slug: 'css-glass-generator',
      url: 'https://css-tricks.com',
      cover: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      summary: '可视化实时调节毛玻璃背景、边框半透明微光与投影参数的 CSS 导出工具。',
      description: '一键生成并复制兼顾 Safari 与 Chromium 的 cross-browser CSS 代码。',
      categoryId: categoriesMap['tools'],
      status: 'published',
      featured: false,
      sortOrder: 65,
      sourceUrl: 'https://github.com',
      completedAt: '2026-01',
      tagSlugs: ['tailwindcss', 'react'],
    }
  ]

  for (const proj of projectsData) {
    const { tagSlugs, ...data } = proj
    await prisma.project.upsert({
      where: { slug: proj.slug },
      update: {
        ...data,
        tags: {
          connect: tagSlugs.map(slug => ({ slug })),
        },
      },
      create: {
        ...data,
        tags: {
          connect: tagSlugs.map(slug => ({ slug })),
        },
      },
    })
  }

  console.log('✅ 数据库初始数据填充完成！')
}

main()
  .catch((e) => {
    console.error('❌ 数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
