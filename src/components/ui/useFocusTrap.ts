"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * 弹窗焦点管理：
 *  1. 打开时把焦点移入弹窗（优先初始焦点元素，其次第一个可聚焦元素）
 *  2. Tab / Shift+Tab 在弹窗内循环，不会跑到背景页面
 *  3. 关闭时把焦点还给打开它的元素
 *
 * 返回的 ref 需要挂到弹窗容器上，容器需带 tabIndex={-1} 作为兜底聚焦目标。
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const containerRef = useRef<T>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // 记住打开前的焦点，关闭时归还
    restoreRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
      );

    // 初始焦点：优先 [data-autofocus]，否则第一个可聚焦元素
    const preferred = container.querySelector<HTMLElement>("[data-autofocus]");
    const target = preferred ?? getFocusable()[0] ?? container;
    // 等一帧，确保弹窗已完成布局
    const raf = requestAnimationFrame(() => target.focus({ preventScroll: true }));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current ? container.contains(current) : false;

      if (e.shiftKey) {
        if (!inside || current === first) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        if (!inside || current === last) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    // 捕获阶段拦截，避免被内部组件提前消费
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown, true);
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return containerRef;
}
