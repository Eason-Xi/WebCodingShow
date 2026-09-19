'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X, Layers, AlertCircle } from 'lucide-react'

interface CategoryItem {
  id: string
  name: string
  slug: string
  sortOrder: number
  _count?: {
    projects: number
  }
}

export function CategoriesManager() {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // 新增表单状态
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newOrder, setNewOrder] = useState(0)
  const [creating, setCreating] = useState(false)

  // 编辑表单状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [editOrder, setEditOrder] = useState(0)

  const [error, setError] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (Array.isArray(data)) setCategories(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 创建分类
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return setError('分类名称为必填项')

    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          slug: newSlug.trim() || undefined,
          sortOrder: Number(newOrder) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '创建分类失败')

      setNewName('')
      setNewSlug('')
      setNewOrder(0)
      fetchCategories()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // 开始编辑
  const startEdit = (item: CategoryItem) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditSlug(item.slug)
    setEditOrder(item.sortOrder)
    setError('')
  }

  // 保存编辑
  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return setError('分类名称不能为空')
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          sortOrder: Number(editOrder) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '更新分类失败')

      setEditingId(null)
      fetchCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // 删除分类
  const handleDelete = async (id: string) => {
    if (!confirm('确认删除此分类？')) return
    setError('')
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '删除分类失败')

      fetchCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink">
          分类管理
        </h1>
        <p className="text-sm text-ink-3 mt-1">
          管理前台作品聚合矩阵中的分类导航、别名与排序权重。
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-btn bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 新增分类框 */}
      <div className="p-6 rounded-card bg-surface border border-line shadow-soft mb-8">
        <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>添加新分类</span>
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs text-ink-3 mb-1">分类名 *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：3D 渲染"
              className="w-full px-3 py-2 rounded-btn border border-line-strong bg-subtle text-xs focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
              required
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs text-ink-3 mb-1">Slug 别名 (可选)</label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="如：3d-render"
              className="w-full px-3 py-2 rounded-btn border border-line-strong bg-subtle text-xs font-mono focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs text-ink-3 mb-1">排序权重</label>
            <input
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-btn border border-line-strong bg-subtle text-xs font-mono focus:border-line-strong focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 px-4 rounded-btn bg-brand text-brand-ink text-xs font-medium hover:opacity-90 transition-all cursor-pointer h-9 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{creating ? '添加中...' : '确认添加'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 分类列表 */}
      <div className="rounded-card border border-line bg-surface overflow-hidden shadow-soft">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line bg-subtle text-[12px] font-medium text-ink-3">
              <th className="py-3 px-6">分类名</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">关联项目</th>
              <th className="py-3 px-4">排序权重</th>
              <th className="py-3 px-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-ink-3">
                  加载分类中...
                </td>
              </tr>
            ) : categories.map((cat) => {
              const isEditing = editingId === cat.id

              return (
                <tr key={cat.id} className="hover:bg-subtle">
                  <td className="py-3.5 px-6 font-medium text-ink">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 rounded border border-line-strong bg-surface text-xs"
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-ink-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="px-2 py-1 rounded border border-line-strong bg-surface text-xs font-mono"
                      />
                    ) : (
                      cat.slug
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-ink-2">
                    {cat._count?.projects ?? 0} 个
                  </td>
                  <td className="py-3.5 px-4 font-mono text-ink-2">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 rounded border border-line-strong bg-surface text-xs font-mono"
                      />
                    ) : (
                      cat.sortOrder
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {isEditing ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="保存"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded text-ink-3 hover:bg-subtle"
                          title="取消"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-subtle transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 rounded-md text-ink-3 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
