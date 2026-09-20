# Web Coding 作品聚合平台 (Portfolio & Projects Navigator)

部署到 Vercel 请先阅读 [部署与数据迁移说明](docs/vercel-deployment.md)。实际技术栈为 Next.js 16.3.5、React 19、Prisma 6.19.3；本地使用 SQLite，云端使用 PostgreSQL 与 Vercel Blob。

> 严格遵循 《WebCoding作品聚合平台_PRD_V1.0.docx》 规范打造。
> 专注于个人面试展示、Web Coding 成果资产化沉淀与零前端代码维护的项目聚合系统。

---

## 🌟 核心特色与设计原则

- **零代码维护闭环**：以后每开发完一个网页项目，只需在管理后台录入一条记录（名称、线上 URL、简介、分类），前台自动即刻呈现，彻底告别频繁改动前端静态代码。
- **面向 500–1000+ 规模设计**：
  - 拒绝单一无序瀑布流，采用**“首页精选聚焦（6-12 个代表作）+ 完整作品库（多维筛选与分页）”**分层展现。
  - 支持即时防抖关键词搜索（名称、简介、技术标签）、分类胶囊筛选与多维度排序（精选优先/排序权重/时间）。
- **极简工程自洽**：
  - 前台作品展示与后台管理系统统一集成在 Next.js 16 App Router 单体工程内。
  - 基于 Prisma ORM，本地使用 SQLite，Vercel 使用 PostgreSQL 与 Blob；通过环境变量选择数据库，并提供数据迁移脚本。
  - Linear / Vercel 现代极简视觉风格，细致的毛玻璃边框微光、呼吸感知悬浮微动效。

---

## 🛠️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **全栈框架** | Next.js 16 (App Router) + TypeScript | 服务端渲染与路由 |
| **样式与动效** | Tailwind CSS v4 + 精选现代组件体系 | 现代极简主义设计与响应式适配 |
| **持久层** | Prisma ORM 6.19 + SQLite / PostgreSQL | 本地与云端数据库配置 |
| **权限认证** | Web Crypto HMAC Token + HttpOnly Cookie | 独立管理员极简安全鉴权中间件 |
| **图标与视觉** | Lucide React + 纯矢量 SVG | 保证跨浏览器极佳渲染质量 |

---

## 🚀 快速启动

### 1. 安装依赖与同步数据库
先复制 `.env.example` 为 `.env`，设置独立的 `ADMIN_PASSWORD`（至少 12 位）和随机 `JWT_SECRET`（至少 32 位）。云端初始化请使用上面的部署说明。

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts   # 注入 6 大基础分类与高质量演示项目数据
```

### 2. 启动本地开发
```bash
npm run dev
```

### 3. 生产环境构建与启动
```bash
npm run build
npm run start
```

服务默认运行在：`http://localhost:3000`

---

## 🔐 管理后台凭证与路由

- **前台首页**：`http://localhost:3000`
- **全部作品库**：`http://localhost:3000/projects`
- **后台控制台**：`http://localhost:3000/admin`
- **后台登录页**：`http://localhost:3000/admin/login`
- **管理员密码**：使用环境变量 `ADMIN_PASSWORD`，不提供默认密码。

---

## 📁 页面与功能结构

```
src/
├── app/
│   ├── page.tsx                     # 前台首页 (Hero + 精选作品 + 分类矩阵)
│   ├── projects/                    # 全部作品库 (搜索 + 分类 Tab + 排序 + 分页)
│   ├── admin/
│   │   ├── login/                   # 管理员登录
│   │   ├── page.tsx                 # 控制台 Dashboard 指标看板
│   │   ├── projects/                # 项目总表 (快速上下架/精选/删除)
│   │   │   ├── new/                 # 录入新作品 (完整 PRD 表单)
│   │   │   └── [id]/edit/           # 编辑作品
│   │   ├── categories/              # 分类管理 (增删改排)
│   │   └── profile/                 # 个人名片与社交外链设置
│   └── api/                         # 完整的 RESTful 数据接口与鉴权中间件
├── components/                      # Navbar, Footer, ProjectCard, Hero, Icons 等
└── lib/
    ├── auth.ts                      # 安全 Session 校验与签发
    └── prisma.ts                    # Prisma 客户端连接单例
```
