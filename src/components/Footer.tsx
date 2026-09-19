import { Mail } from 'lucide-react'
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
    <footer className="mt-20 border-t border-line py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-8">
        <div className="text-center sm:text-left">
          <p className="text-[13.5px] font-medium text-ink-2">
            © {currentYear} {profile?.name || 'Web Developer'}. 保留所有权利。
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-3">
            专注构建有美感与实用价值的现代 Web &amp; AI 作品。
          </p>
        </div>

        <div className="flex items-center gap-1">
          {profile?.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              aria-label="GitHub"
              className="grid h-9 w-9 place-items-center rounded-btn text-ink-3 transition-colors duration-200 hover:bg-subtle hover:text-ink"
            >
              <GithubIcon className="h-[17px] w-[17px]" />
            </a>
          )}
          {profile?.xUrl && (
            <a
              href={profile.xUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Twitter / X"
              aria-label="Twitter / X"
              className="grid h-9 w-9 place-items-center rounded-btn text-ink-3 transition-colors duration-200 hover:bg-subtle hover:text-ink"
            >
              <TwitterIcon className="h-[17px] w-[17px]" />
            </a>
          )}
          {profile?.email && (
            <a
              href={`mailto:${profile.email}`}
              title="Email"
              aria-label="Email"
              className="grid h-9 w-9 place-items-center rounded-btn text-ink-3 transition-colors duration-200 hover:bg-subtle hover:text-ink"
            >
              <Mail className="h-[17px] w-[17px]" strokeWidth={1.9} />
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
