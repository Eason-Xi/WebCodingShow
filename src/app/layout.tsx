import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Sparkles, Clapperboard, FolderGit2 } from "lucide-react";

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
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
                    AI 访谈导演
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Interview AI
                  </span>
                </div>
                <p className="text-xs text-slate-400">采访者身旁的第二导演 · 全流程 AI 工作台</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>全流程上下文已激活</span>
              </div>
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-3.5 py-1.5 rounded-lg transition-all"
              >
                <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                我的访谈
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
