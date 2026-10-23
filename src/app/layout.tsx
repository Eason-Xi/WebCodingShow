import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BackgroundMusicPlayer } from "@/components/BackgroundMusicPlayer";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MUSIC_SETTINGS, settingsFromRecord } from "@/lib/music";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://webcoding-show.vercel.app",
  ),
  title: {
    default: "WebCoding 作品集合平台",
    template: "%s · WebCoding",
  },
  description:
    "展示 Web 编程、AI 工具、数据可视化与创意交互作品，并记录项目复盘、技术实践与创作过程。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const musicSettings = await prisma.musicSettings
    .findUnique({ where: { id: "default" } })
    .then(settingsFromRecord)
    .catch(() => DEFAULT_MUSIC_SETTINGS);

  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <BackgroundMusicPlayer settings={musicSettings} />
      </body>
    </html>
  );
}
