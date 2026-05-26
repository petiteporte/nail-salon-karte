'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, UserCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type StaffUser = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StaffUser[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? '')
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (userId: string) => {
    if (!confirm('このスタッフアカウントを削除しますか？')) return
    setDeleting(userId)
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    await load()
    setDeleting(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-700">スタッフ管理</h1>
        <Link
          href="/admin/users/new"
          className="ml-auto bg-pink-400 hover:bg-pink-500 text-white rounded-full px-4 py-2 text-sm font-bold flex items-center gap-1"
        >
          <Plus size={16} /> 追加
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : (
        <ul className="space-y-3">
          {users.map(user => (
            <li key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex items-center gap-3">
              <UserCircle size={36} className="text-pink-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-700 truncate">{user.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {user.last_sign_in_at
                    ? `最終ログイン: ${new Date(user.last_sign_in_at).toLocaleDateString('ja-JP')}`
                    : '未ログイン'}
                </p>
                {user.id === currentUserId && (
                  <span className="text-xs bg-pink-100 text-pink-500 px-2 py-0.5 rounded-full">あなた</span>
                )}
              </div>
              {user.id !== currentUserId && (
                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={deleting === user.id}
                  className="text-gray-300 hover:text-red-400 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
