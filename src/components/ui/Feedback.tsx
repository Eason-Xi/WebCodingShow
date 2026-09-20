"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

/* ==========================================================================
   Toast 存储（模块级，无需 Context）
   ========================================================================== */

export type ToastTone = "success" | "error" | "info" | "loading";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  desc?: string;
}

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function pushToast(tone: ToastTone, title: string, desc?: string): number {
  const id = ++seq;
  items = [...items, { id, tone, title, desc }];
  emit();
  if (tone !== "loading") {
    setTimeout(() => dismissToast(id), tone === "error" ? 7000 : 3600);
  }
  return id;
}

export const toast = {
  success: (title: string, desc?: string) => pushToast("success", title, desc),
  error: (title: string, desc?: string) => pushToast("error", title, desc),
  info: (title: string, desc?: string) => pushToast("info", title, desc),
  loading: (title: string, desc?: string) => pushToast("loading", title, desc),
};

/**
 * 统一的异步任务包装：自动弹出 loading，成功后替换为成功提示，
 * 失败时把真实错误信息透出（原实现是 console.error 静默吞掉）。
 */
export async function runTask<T>(
  loadingMsg: string,
  successMsg: string,
  task: () => Promise<T>,
  failureMsg = "操作失败"
): Promise<{ ok: boolean; data?: T }> {
  const tid = toast.loading(loadingMsg);
  try {
    const data = await task();
    dismissToast(tid);
    if (successMsg) toast.success(successMsg);
    return { ok: true, data };
  } catch (e) {
    dismissToast(tid);
    toast.error(failureMsg, e instanceof Error ? e.message : String(e));
    return { ok: false };
  }
}

import { getAIHeaders } from "@/lib/client-settings";

/** 请求 JSON 并在 success=false 时抛出可读错误 */
export async function requestJson<T = unknown>(
  url: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  const customAiHeaders = typeof window !== "undefined" ? getAIHeaders() : {};
  const mergedHeaders = {
    ...customAiHeaders,
    ...(init?.headers || {}),
  };

  try {
    res = await fetch(url, {
      ...init,
      headers: mergedHeaders,
    });
  } catch {
    throw new Error("网络请求失败，请确认服务是否在运行");
  }
  const json = await res.json().catch(() => null);
  if (!json) throw new Error(`服务返回了非 JSON 响应（HTTP ${res.status}）`);
  if (!res.ok || json.success === false) {
    throw new Error(
      json.error || (res.ok ? "服务端未能完成该操作" : `请求失败（HTTP ${res.status}）`)
    );
  }
  return (json.data ?? json) as T;
}

/* ==========================================================================
   确认弹窗（替代原生 confirm，Promise 化）
   ========================================================================== */

interface ConfirmState {
  title: string;
  description?: string;
  confirmText: string;
  tone: "danger" | "default";
  resolve: (v: boolean) => void;
}

let confirmState: ConfirmState | null = null;

export function confirmDialog(opts: {
  title: string;
  description?: string;
  confirmText?: string;
  tone?: "danger" | "default";
}): Promise<boolean> {
  // 避免多个弹窗叠加
  confirmState?.resolve(false);
  return new Promise((resolve) => {
    confirmState = {
      title: opts.title,
      description: opts.description,
      confirmText: opts.confirmText || "确认",
      tone: opts.tone || "default",
      resolve: (v: boolean) => {
        confirmState = null;
        resolve(v);
        emit();
      },
    };
    emit();
  });
}

/* ==========================================================================
   宿主组件
   ========================================================================== */

const TONE_STYLE: Record<ToastTone, { icon: typeof Info; ring: string; text: string }> = {
  success: { icon: CheckCircle2, ring: "border-emerald-500/30", text: "text-emerald-300" },
  error: { icon: AlertTriangle, ring: "border-rose-500/35", text: "text-rose-300" },
  info: { icon: Info, ring: "border-indigo-500/30", text: "text-indigo-300" },
  loading: { icon: Loader2, ring: "border-line-2", text: "text-indigo-300" },
};

export function FeedbackHost() {
  const [, force] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") confirmState?.resolve(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mounted, confirmState]);

  // 确认弹窗的焦点陷阱：初始聚焦「取消」，Tab 不逃逸，关闭后归还焦点
  const confirmRef = useFocusTrap<HTMLDivElement>(Boolean(confirmState));

  if (!mounted) return null;

  return (
    <>
      {/* Toast 堆栈 */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2"
      >
        {items.map((t) => {
          const tone = TONE_STYLE[t.tone];
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              className={clsx(
                "glass-panel animate-rise pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5",
                tone.ring
              )}
            >
              <Icon
                className={clsx(
                  "mt-0.5 h-4 w-4 shrink-0",
                  tone.text,
                  t.tone === "loading" && "animate-spin"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-snug text-1">{t.title}</p>
                {t.desc && (
                  <p className="mt-1 break-words text-[11px] leading-relaxed text-3">{t.desc}</p>
                )}
              </div>
              {t.tone !== "loading" && (
                <button
                  onClick={() => dismissToast(t.id)}
                  className="btn btn-ghost btn-xs -mr-1 -mt-0.5"
                  aria-label="关闭提示"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 确认弹窗 */}
      {confirmState && (
        <div
          className="animate-fade fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) confirmState?.resolve(false);
          }}
        >
          <div
            ref={confirmRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            tabIndex={-1}
            className="glass-panel animate-scale-in w-full max-w-sm rounded-2xl p-5 outline-none"
          >
            <div className="flex items-start gap-3">
              <span
                className={clsx(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                  confirmState.tone === "danger"
                    ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h3
                  id="confirm-dialog-title"
                  className="text-sm font-semibold tracking-tight text-1"
                >
                  {confirmState.title}
                </h3>
                {confirmState.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-3">
                    {confirmState.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-line-1 pt-4">
              <button
                onClick={() => confirmState?.resolve(false)}
                data-autofocus
                className="btn btn-ghost btn-md"
              >
                取消
              </button>
              <button
                onClick={() => confirmState?.resolve(true)}
                className={clsx(
                  "btn btn-md",
                  confirmState.tone === "danger" ? "btn-danger" : "btn-primary"
                )}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
