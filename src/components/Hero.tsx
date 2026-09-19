import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

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
    <section className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 md:pb-24 md:pt-20">
      {/* 中性微光氛围 */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[440px] w-[880px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(122,122,140,0.13),transparent)] blur-2xl"
      />

      <div className="mx-auto max-w-3xl text-center">
        {/* 状态徽章 */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 shadow-soft">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[12.5px] font-medium text-ink-2">
            持续沉淀中 · 已汇聚 <span className="tabular font-semibold text-ink">{totalCount}</span> 个 Web 创意与作品
          </span>
        </div>

        {/* 头像 */}
        {profile.avatar && (
          <div className="mx-auto mb-7 h-[84px] w-[84px] rounded-full bg-gradient-to-b from-line to-line-strong p-[2px] shadow-card">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        )}

        {/* 姓名 */}
        <h1 className="text-[30px] leading-[1.3] sm:text-[42px] sm:leading-[1.22]">
          <span className="font-normal text-ink-2">你好，我是</span>{' '}
          <span className="font-bold text-ink">{profile.name}</span>
        </h1>

        {/* 头衔 */}
        <p className="mt-3.5 text-[15px] font-medium text-ink-2 sm:text-[17px]">
          {profile.title}
        </p>

        {/* 简介 */}
        <p className="mx-auto mt-5 max-w-[52ch] text-[14.5px] leading-[1.85] text-ink-2">
          {profile.bio}
        </p>

        {/* 技能标签 */}
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="rounded-chip border border-line bg-surface px-2.5 py-1 font-mono text-[11.5px] font-medium text-ink-2"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* 行动按钮 */}
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/projects"
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand px-5 py-2.5 text-[14px] font-medium text-brand-ink shadow-card transition-all duration-200 hover:bg-brand-hover active:scale-[0.98] sm:w-auto"
          >
            <span>探索完整项目库</span>
            <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <a
            href="#featured"
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn border border-line-strong bg-surface px-5 py-2.5 text-[14px] font-medium text-ink transition-colors duration-200 hover:bg-subtle sm:w-auto"
          >
            <Sparkles className="h-4 w-4 text-amber-500" strokeWidth={2.2} />
            <span>查看代表作</span>
          </a>
        </div>
      </div>
    </section>
  )
}
