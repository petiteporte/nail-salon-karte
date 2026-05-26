'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check, X } from 'lucide-react'

type Staff = { id: string; name: string; sort_order: number }

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const load = () => {
    supabase.from('staff').select('*').order('sort_order')
      .then(({ data }) => {
        setStaffList(data ?? [])
        setLoading(false)
      })
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    await supabase.from('staff').insert([{
      name: newName.trim(),
      sort_order: staffList.length,
    }])
    setNewName('')
    setAdding(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('staff').delete().eq('id', id)
    load()
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const list = [...staffList]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) return

    ;[list[index], list[targetIndex]] = [list[targetIndex], list[index]]
    const updates = list.map((item, i) => ({ id: item.id, sort_order: i }))

    setStaffList(list.map((item, i) => ({ ...item, sort_order: i })))

    await Promise.all(updates.map(u =>
      supabase.from('staff').update({ sort_order: u.sort_order }).eq('id', u.id)
    ))
  }

  const startEdit = (staff: Staff) => {
    setEditingId(staff.id)
    setEditingName(staff.name)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return
    await supabase.from('staff').update({ name: editingName.trim() }).eq('id', id)
    setEditingId(null)
    load()
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-700">スタッフ管理</h1>
      </div>

      {/* 追加フォーム */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text" value={newName} onChange={e => setNewName(e.target.value)}
          placeholder="スタッフ名を入力"
          className="flex-1 bg-white border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
        />
        <button type="submit" disabled={adding || !newName.trim()}
          className="bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white rounded-xl px-4 py-3 font-bold text-sm flex items-center gap-1 transition-colors">
          <Plus size={16} />追加
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : staffList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">スタッフが登録されていません</p>
      ) : (
        <ul className="space-y-2">
          {staffList.map((staff, index) => (
            <li key={staff.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex items-center gap-2">
              {/* 並び替えボタン */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  className="text-gray-300 hover:text-pink-400 disabled:opacity-20 transition-colors">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === staffList.length - 1}
                  className="text-gray-300 hover:text-pink-400 disabled:opacity-20 transition-colors">
                  <ChevronDown size={16} />
                </button>
              </div>

              {/* 名前（編集中は入力欄） */}
              {editingId === staff.id ? (
                <input
                  type="text" value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(staff.id); if (e.key === 'Escape') handleCancelEdit() }}
                  autoFocus
                  className="flex-1 border border-pink-300 rounded-xl px-3 py-1.5 text-sm outline-none focus:border-pink-400"
                />
              ) : (
                <p className="flex-1 font-bold text-gray-700">{staff.name}</p>
              )}

              {/* 編集中のボタン */}
              {editingId === staff.id ? (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleSaveEdit(staff.id)}
                    className="text-white bg-pink-400 hover:bg-pink-500 rounded-lg p-1.5 transition-colors">
                    <Check size={15} />
                  </button>
                  <button onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(staff)}
                    className="text-gray-300 hover:text-pink-400 transition-colors p-1">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(staff.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-gray-400 text-center pt-2">
        ここで追加した名前が施術記録の担当スタッフ欄に表示されます
      </p>
    </div>
  )
}
