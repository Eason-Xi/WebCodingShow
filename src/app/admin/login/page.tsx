import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-100/60 dark:bg-neutral-950">
      <Suspense fallback={<div className="text-sm text-neutral-400">加载中...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
