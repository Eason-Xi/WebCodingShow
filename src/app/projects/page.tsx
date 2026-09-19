import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProjectsClient } from './ProjectsClient'

export const revalidate = 0

export default async function ProjectsPage() {
  const profile = await prisma.profile.findUnique({ where: { id: 'default' } })

  const safeProfile = profile || {
    name: 'Web 独立创作者',
    githubUrl: 'https://github.com',
    xUrl: 'https://x.com',
    email: 'creator@example.com',
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50/50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-4 py-20 text-center text-sm text-neutral-400">
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
