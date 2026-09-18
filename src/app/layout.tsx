import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Clapperboard, Sparkles, LayoutGrid } from "lucide-react";
import { FeedbackHost } from "@/components/ui/Feedback";
import ThemeToggle, { THEME_INIT_SCRIPT } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "AI 访谈导演 | Interview AI 工作台",
  description: "全流程 AI 驱动的人物访谈与内容生产工作台，让 AI 成为您身边的第二个导演。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        {/* 主题在首屏绘制前同步应用，避免浅色主题下先闪深色 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        <header className="sticky top-0 z-50 border-b border-line-1 bg-[color:var(--header-bg)] backdrop-blur-xl">
          <div className="shell flex h-16 items-center justify-between gap-4">
            {/* 品牌 */}
            <Link href="/" className="group flex items-center gap-3">
              <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-tint bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-accent transition-transform duration-300 group-hover:scale-[1.06]">
                <Clapperboard className="h-[18px] w-[18px] text-white" />
                <span className="tint-hi pointer-events-none absolute inset-x-0 top-0 h-px" />
              </span>
              <span className="flex flex-col">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold tracking-tight text-gradient">
                    AI 访谈导演
                  </span>
                  <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-indigo-300">
                    v1.0
                  </span>
                </span>
                <span className="text-[11px] leading-tight text-4">
                  采访者身旁的第二导演
                </span>
              </span>
            </Link>

            {/* 右侧操作 */}
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-line-1 bg-surface-2 px-3 py-1.5 text-[11px] text-3 md:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping-soft" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span>全流程上下文已激活</span>
              </div>

              <ThemeToggle />

              <Link href="/" className="btn btn-secondary btn-sm h-9 px-3.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">我的访谈</span>
              </Link>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        <footer className="border-t border-line-1 py-6">
          <div className="shell flex flex-col items-center justify-between gap-2 text-[11px] text-4 sm:flex-row">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-indigo-400/70" />
              资料研究 → 采访策划 → 彩排提词 → 录音转写 → 拆条包装
            </span>
            <span>AI 访谈导演 · Interview AI Workbench</span>
          </div>
        </footer>

        <FeedbackHost />
      </body>
    </html>
  );
}
