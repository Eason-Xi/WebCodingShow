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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
          分类管理
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          管理前台作品聚合矩阵中的分类导航、别名与排序权重。
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 新增分类框 */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs mb-8">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>添加新分类</span>
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="block text-xs text-neutral-500 mb-1">分类名 *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：3D 渲染"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              required
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs text-neutral-500 mb-1">Slug 别名 (可选)</label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="如：3d-render"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs text-neutral-500 mb-1">排序权重</label>
            <input
              type="number"
              value={newOrder}
              onChange={(e) => setNewOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium hover:opacity-90 transition-all cursor-pointer h-9 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{creating ? '添加中...' : '确认添加'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 分类列表 */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              <th className="py-3 px-6">分类名</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">关联项目</th>
              <th className="py-3 px-4">排序权重</th>
              <th className="py-3 px-6 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-neutral-400">
                  加载分类中...
                </td>
              </tr>
            ) : categories.map((cat) => {
              const isEditing = editingId === cat.id

              return (
                <tr key={cat.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                  <td className="py-3.5 px-6 font-medium text-neutral-900 dark:text-white">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs"
                      />
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-500">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-mono"
                      />
                    ) : (
                      cat.slug
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                    {cat._count?.projects ?? 0} 个
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editOrder}
                        onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-xs font-mono"
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
                          className="p-1 rounded text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="取消"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
