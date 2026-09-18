"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, LayoutGrid } from "lucide-react";

/**
 * 路由级错误边界。
 * 数据层已做归一化，正常情况不该走到这里；这层是兜底——万一某个组件仍然抛错，
 * 用户看到的应该是一个能读懂、能恢复的界面，而不是整页空白加一句英文报错。
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("界面渲染错误:", error);
  }, [error]);

  return (
    <div className="shell w-full py-20">
      <div className="glass-panel mx-auto max-w-xl overflow-hidden rounded-3xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
        </span>

        <h1 className="mt-5 text-base font-semibold tracking-tight text-1">
          这个页面出了点问题
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-3">
          渲染时发生了未预期的错误。你可以先重试；如果反复出现，多半是某个项目的数据结构异常，
          可以回到项目列表换一个项目查看。
        </p>

        {error.message && (
          <p className="inset mx-auto mt-4 max-w-sm break-words rounded-xl p-3 text-left font-mono text-[11px] leading-relaxed text-3">
            {error.message}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="btn btn-primary btn-md">
            <RotateCcw className="h-3.5 w-3.5" />
            重试
          </button>
          <Link href="/" className="btn btn-secondary btn-md">
            <LayoutGrid className="h-3.5 w-3.5" />
            返回项目列表
          </Link>
        </div>
      </div>
    </div>
  );
}
