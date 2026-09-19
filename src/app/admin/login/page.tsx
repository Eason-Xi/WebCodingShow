import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-subtle">
      <Suspense fallback={<div className="text-sm text-ink-3">加载中...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
