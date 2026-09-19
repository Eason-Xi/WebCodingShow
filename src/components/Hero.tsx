import Link from 'next/link'
import { ArrowRight, Sparkles, Code2, Terminal, Cpu } from 'lucide-react'

interface HeroProps {
  profile: {
    name: string
    title: string
    bio: string
    avatar?: string | null
  }
  totalCount: number
}

export function Hero({ profile, totalCount }: HeroProps) {
  const skills = ['Next.js', 'React', 'TypeScript', 'WebGL / Three.js', 'Tailwind CSS', 'AI Tools', 'D3.js']

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* 极简背景微光氛围 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto text-center px-4">
        {/* 状态徽章 */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 mb-6 shadow-2xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>持续沉淀中 · 已汇聚 {totalCount} 个 Web 创意与作品</span>
        </div>

        {/* 头像 */}
        {profile.avatar && (
          <div className="mx-auto mb-6 w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-neutral-200 via-neutral-100 to-neutral-300 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-900 shadow-lg">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        )}

        {/* 姓名与头衔 */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.15]">
          你好，我是 <span className="text-neutral-900 dark:text-neutral-100">{profile.name}</span>
        </h1>
        <p className="mt-3 text-lg sm:text-xl font-medium text-neutral-600 dark:text-neutral-400">
          {profile.title}
        </p>

        {/* 一句话介绍 */}
        <p className="mt-4 text-base text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          {profile.bio}
        </p>

        {/* 核心技能标签 */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 rounded-lg text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* 行动按钮 */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/projects"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm hover:opacity-90 transition-all shadow-md active:scale-95"
          >
            <span>探索完整项目库</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#featured"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 text-neutral-800 dark:text-neutral-200 font-medium text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>查看代表作</span>
          </a>
        </div>
      </div>
    </section>
  )
}
