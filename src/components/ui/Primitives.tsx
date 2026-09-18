"use client";

import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* ==========================================================================
   色调系统
   ========================================================================== */

export type Tone =
  | "indigo"
  | "violet"
  | "purple"
  | "pink"
  | "amber"
  | "emerald"
  | "cyan"
  | "sky"
  | "rose"
  | "slate";

interface ToneClasses {
  text: string;
  bg: string;
  border: string;
  tile: string;
  dot: string;
}

export const TONE: Record<Tone, ToneClasses> = {
  indigo: {
    text: "text-indigo-300",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/25",
    tile: "bg-gradient-to-br from-indigo-500/25 to-violet-500/10 border-indigo-500/25",
    dot: "bg-indigo-400",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    tile: "bg-gradient-to-br from-violet-500/25 to-purple-500/10 border-violet-500/25",
    dot: "bg-violet-400",
  },
  purple: {
    text: "text-purple-300",
    bg: "bg-purple-500/10",
    border: "border-purple-500/25",
    tile: "bg-gradient-to-br from-purple-500/25 to-fuchsia-500/10 border-purple-500/25",
    dot: "bg-purple-400",
  },
  pink: {
    text: "text-pink-300",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
    tile: "bg-gradient-to-br from-pink-500/25 to-rose-500/10 border-pink-500/25",
    dot: "bg-pink-400",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    tile: "bg-gradient-to-br from-amber-500/25 to-orange-500/10 border-amber-500/25",
    dot: "bg-amber-400",
  },
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    tile: "bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  cyan: {
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    tile: "bg-gradient-to-br from-cyan-500/25 to-sky-500/10 border-cyan-500/25",
    dot: "bg-cyan-400",
  },
  sky: {
    text: "text-sky-300",
    bg: "bg-sky-500/10",
    border: "border-sky-500/25",
    tile: "bg-gradient-to-br from-sky-500/25 to-blue-500/10 border-sky-500/25",
    dot: "bg-sky-400",
  },
  rose: {
    text: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/25",
    tile: "bg-gradient-to-br from-rose-500/25 to-red-500/10 border-rose-500/25",
    dot: "bg-rose-400",
  },
  slate: {
    text: "text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/25",
    tile: "bg-gradient-to-br from-slate-500/20 to-slate-700/10 border-slate-500/25",
    dot: "bg-slate-400",
  },
};

/* ==========================================================================
   Chip — 徽标 / 标签
   ========================================================================== */

export function Chip({
  children,
  tone = "slate",
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  const t = TONE[tone];
  return (
    <span
      className={clsx("chip", t.bg, t.text, t.border, className)}
    >
      {dot && <span className={clsx("h-1.5 w-1.5 rounded-full", t.dot)} />}
      {children}
    </span>
  );
}

/* ==========================================================================
   IconTile — 图标方块
   ========================================================================== */

export function IconTile({
  icon: Icon,
  tone = "indigo",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = {
    sm: "h-8 w-8 rounded-lg",
    md: "h-10 w-10 rounded-xl",
    lg: "h-12 w-12 rounded-2xl",
  }[size];
  const iconSize = { sm: "h-4 w-4", md: "h-[18px] w-[18px]", lg: "h-5 w-5" }[size];
  const t = TONE[tone];
  return (
    <div
      className={clsx(
        "grid shrink-0 place-items-center border",
        dims,
        t.tile,
        t.text,
        className
      )}
    >
      <Icon className={iconSize} />
    </div>
  );
}

/* ==========================================================================
   TabHeader — 各 Tab 统一的页头
   ========================================================================== */

export function TabHeader({
  icon,
  tone = "indigo",
  title,
  description,
  meta,
  actions,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="glass-panel animate-rise rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <IconTile icon={icon} tone={tone} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold tracking-tight text-1">{title}</h2>
              {meta}
            </div>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-3">{description}</p>
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pl-4">{actions}</div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   SectionTitle — 区块小标题
   ========================================================================== */

export function SectionTitle({
  icon: Icon,
  tone = "indigo",
  children,
  extra,
  className,
}: {
  icon?: LucideIcon;
  tone?: Tone;
  children: ReactNode;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between gap-3", className)}>
      <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-1">
        {Icon && <Icon className={clsx("h-4 w-4", TONE[tone].text)} />}
        {children}
      </h3>
      {extra}
    </div>
  );
}

/* ==========================================================================
   EmptyState — 空状态
   ========================================================================== */

export function EmptyState({
  icon: Icon,
  tone = "indigo",
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "glass-panel relative flex flex-col items-center justify-center overflow-hidden rounded-2xl text-center",
        compact ? "px-6 py-10" : "px-6 py-16",
        className
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl",
          TONE[tone].bg
        )}
      />
      <div className="relative">
        <IconTile icon={Icon} tone={tone} size="lg" className="mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-1">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-3">{description}</p>
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

/* ==========================================================================
   ProgressBar — 流程进度条
   ========================================================================== */

export function ProgressBar({
  percent,
  tone = "indigo",
  className,
}: {
  percent: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full tint-3", className)}>
      <div
        className={clsx(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "emerald"
            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
            : tone === "pink"
            ? "bg-gradient-to-r from-pink-500 to-violet-500"
            : "bg-gradient-to-r from-indigo-500 to-violet-400"
        )}
        style={{ width: `${Math.max(percent, percent > 0 ? 6 : 0)}%` }}
      />
    </div>
  );
}

/* ==========================================================================
   StageDots — 五阶段迷你进度点
   ========================================================================== */

export function StageDots({
  done,
  className,
  size = "md",
}: {
  done: boolean[];
  className?: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={clsx("flex items-center gap-1", className)}>
      {done.map((d, i) => (
        <span
          key={i}
          className={clsx(
            dim,
            "flex-1 rounded-full transition-colors duration-500",
            d ? "bg-gradient-to-r from-indigo-400 to-violet-400" : "tint-4"
          )}
        />
      ))}
    </div>
  );
}

/* ==========================================================================
   Field — 带标签的表单行
   ========================================================================== */

export function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="field-label">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
        {hint && <span className="ml-2 font-normal text-4">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
