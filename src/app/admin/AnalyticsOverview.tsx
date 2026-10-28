import Link from 'next/link'
import { analyticsOverview } from '@/lib/analytics'
import { AnalyticsRefresh } from './AnalyticsRefresh'

export async function AnalyticsOverview() {
  const data = await analyticsOverview()
  const today = data.days.at(-1)!
  const cards = [
    ['今日浏览', today.views], ['累计浏览', data.totals.views ?? 0],
    ['累计播客播放', data.totals.plays ?? 0], ['视频链接点击', data.totals.videoClicks ?? 0],
    ['在线体验点击', data.totals.experienceClicks ?? 0],
  ] as const
  const max = Math.max(1, ...data.days.map(d => Math.max(d.views, d.plays)))
  return <section aria-labelledby="traffic-heading" className="mb-10 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="traffic-heading" className="text-lg font-semibold">内容访问统计</h2><p className="mt-1 text-xs leading-6 text-ink-3">从功能启用后累计 · 台北时间 · 同一浏览器同类操作 30 分钟内计一次 · 排除已登录管理员</p></div><AnalyticsRefresh /></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{cards.map(([label, count]) => <div key={label} className="rounded-card border border-line bg-surface p-4"><p className="text-xs text-ink-3">{label}</p><p className="mt-3 text-2xl font-semibold tabular-nums">{count.toLocaleString()}</p></div>)}</div>
    <div className="rounded-card border border-line bg-surface p-4 sm:p-6">
      <h3 className="text-sm font-semibold">近 7 天浏览与播放</h3>
      <p className="mt-2 text-xs text-ink-3"><span className="mr-4">● 浏览</span><span className="text-amber-700 dark:text-amber-400">● 播客播放</span></p>
      <div className="mt-5 grid grid-cols-7 gap-2" aria-hidden="true">{data.days.map(d => <div key={d.day} className="min-w-0 text-center"><div className="flex h-28 items-end justify-center gap-1 border-b border-line"><div className="w-3 rounded-t bg-ink" style={{ height: `${d.views / max * 100}%` }} /><div className="w-3 rounded-t bg-amber-500" style={{ height: `${d.plays / max * 100}%` }} /></div><p className="mt-2 text-[10px] text-ink-3">{d.day.slice(5)}</p><p className="mt-1 text-[11px] tabular-nums">{d.views.toLocaleString()} / {d.plays.toLocaleString()}</p></div>)}</div>
      <table className="sr-only"><caption>近 7 天内容数据</caption><thead><tr><th>日期</th><th>浏览量</th><th>播客播放量</th></tr></thead><tbody>{data.days.map(d => <tr key={d.day}><th>{d.day}</th><td>{d.views}</td><td>{d.plays}</td></tr>)}</tbody></table>
      {data.days.every(d => !d.views && !d.plays) && <p className="mt-4 text-xs text-ink-3">最近 7 天暂无访问数据，访客打开内容或播放播客后会开始累计。</p>}
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-card border border-line bg-surface p-5"><h3 className="text-sm font-semibold">热门作品与文章 · 累计浏览</h3><ol className="mt-3 divide-y divide-line">{data.popular.map(p => <li key={`${p.label}-${p.id}`} className="flex items-center justify-between gap-4 py-3 text-sm"><Link href={p.href} className="min-w-0 truncate hover:underline"><span className="mr-2 text-xs text-ink-3">{p.label}</span>{p.title}</Link><span className="tabular-nums">{p.count.toLocaleString()}</span></li>)}</ol>{!data.popular.length && <p className="mt-4 text-xs text-ink-3">暂无浏览记录</p>}</div>
      <div className="rounded-card border border-line bg-surface p-5"><h3 className="text-sm font-semibold">热门播客 · 累计播放</h3><ol className="mt-3 divide-y divide-line">{data.episodes.map(e => <li key={e.id} className="flex items-center justify-between gap-4 py-3 text-sm"><Link href={`/podcasts/${e.id}`} className="min-w-0 truncate hover:underline">{e.title}</Link><span className="tabular-nums">{e.playCount.toLocaleString()}</span></li>)}</ol>{!data.episodes.length && <p className="mt-4 text-xs text-ink-3">暂无播放记录</p>}</div>
    </div>
    <p className="text-xs leading-6 text-ink-3">浏览量统计内容详情页；播客播放量记录站内音频实际开始播放。视频点击不代表外部平台播放量。总览保留已删除内容的历史访问。</p>
  </section>
}
