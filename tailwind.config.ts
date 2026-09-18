import type { Config } from "tailwindcss";

/**
 * 语义色板通过 CSS 变量暴露，具体色值定义在 globals.css：
 *   :root               → 深色主题（默认）
 *   [data-theme=light]  → 浅色主题
 * 这样切换主题不需要改动任何业务代码里的 text-* / bg-* / border-* 类名。
 *
 * ⚠️ 这里列出的色阶必须与 globals.css 中的 --c-<name>-<shade> 变量保持一致；
 *    新增色阶时两处都要加。
 */
const PALETTE_SHADES: Record<string, number[]> = {
  amber: [100, 200, 300, 400, 500, 600, 700, 800],
  cyan: [300, 400, 500, 600, 700, 800],
  emerald: [300, 400, 500, 600, 700, 800],
  indigo: [100, 200, 300, 400, 500, 600, 700, 800],
  lime: [100, 200, 300, 400, 500, 600, 700, 800],
  pink: [200, 300, 400, 500, 600, 700, 800],
  purple: [200, 300, 400, 500, 600, 700, 800],
  rose: [300, 400, 500, 600, 700, 800],
  sky: [300, 400, 500, 600, 700, 800],
  slate: [300, 400, 500, 600, 700, 800],
  violet: [300, 400, 500, 600, 700, 800],
};

const themedColors: Record<string, Record<string, string>> = {};
for (const [name, shades] of Object.entries(PALETTE_SHADES)) {
  themedColors[name] = {};
  for (const shade of shades) {
    // <alpha-value> 让 /10、/25 这类透明度修饰继续可用
    themedColors[name][shade] = `rgb(var(--c-${name}-${shade}) / <alpha-value>)`;
  }
}

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        foreground: "var(--text-1)",
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          inset: "var(--surface-inset)",
        },
        line: {
          1: "var(--line-1)",
          2: "var(--line-2)",
          3: "var(--line-3)",
        },
        ink: {
          1: "var(--text-1)",
          2: "var(--text-2)",
          3: "var(--text-3)",
          4: "var(--text-4)",
        },
        brand: {
          lime: "rgb(var(--c-lime-400) / <alpha-value>)",
          "lime-text": "var(--c-lime-text)",
          violet: "rgb(var(--c-violet-400) / <alpha-value>)",
          obsidian: "var(--c-obsidian)",
          paper: "var(--c-paper)",
          "paper-card": "var(--c-paper-card)",
          "paper-line": "var(--c-paper-line)",
        },
        ...themedColors,
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "var(--shadow-2)",
        lift: "var(--shadow-3)",
        accent: "var(--shadow-accent)",
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      maxWidth: {
        shell: "1440px",
      },
    },
  },
  plugins: [],
};
export default config;
