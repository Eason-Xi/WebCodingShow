import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProjectsClient } from './ProjectsClient'

export const revalidate = 0

export const metadata = {
  title: '完整作品库',
}

export default async function ProjectsPage() {
  const profile = await prisma.profile.findUnique({ where: { id: 'default' } })

  const safeProfile = profile || {
    name: 'Web 独立创作者',
    githubUrl: 'https://github.com',
    xUrl: 'https://x.com',
    email: 'creator@example.com',
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-6xl px-5 py-24 text-center text-[13.5px] text-ink-3 sm:px-8">
              加载项目库中...
            </div>
          }
        >
          <ProjectsClient />
        </Suspense>
      </main>
      <Footer profile={safeProfile} />
    </div>
  )
}
