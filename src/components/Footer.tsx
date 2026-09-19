import Link from 'next/link'
import { Mail, ExternalLink } from 'lucide-react'
import { GithubIcon, TwitterIcon } from './Icons'

interface FooterProps {
  profile?: {
    name?: string
    githubUrl?: string | null
    xUrl?: string | null
    email?: string | null
  }
}

export function Footer({ profile }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 py-12 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
            © {currentYear} {profile?.name || 'Web Developer'}. 保留所有权利。
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            专注构建有美感与实用价值的现代 Web & AI 作品。
          </p>
        </div>

        <div className="flex items-center gap-4">
          {profile?.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="GitHub"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
          {profile?.xUrl && (
            <a
              href={profile.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Twitter / X"
            >
              <TwitterIcon className="w-4 h-4" />
            </a>
          )}
          {profile?.email && (
            <a
              href={`mailto:${profile.email}`}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
