import { Navbar } from '@/components/Navbar'

export default function BlogLoading() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main aria-busy="true" aria-label="正在加载博客">
        <div className="border-b border-line px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl animate-pulse text-center">
            <div className="mx-auto h-7 w-36 rounded-full bg-muted" />
            <div className="mx-auto mt-7 h-12 max-w-2xl rounded-card bg-muted" />
            <div className="mx-auto mt-5 h-5 max-w-xl rounded bg-subtle" />
          </div>
        </div>
        <div className="mx-auto max-w-6xl animate-pulse px-5 py-14 sm:px-8">
          <div className="mb-7 h-8 w-32 rounded bg-muted" />
          <div className="grid overflow-hidden rounded-card border border-line bg-surface md:grid-cols-2">
            <div className="min-h-64 bg-muted" />
            <div className="space-y-4 p-7">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-10 w-full rounded bg-muted" />
              <div className="h-4 w-full rounded bg-subtle" />
              <div className="h-4 w-4/5 rounded bg-subtle" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
