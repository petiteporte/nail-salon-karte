'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
      setNewEmail(data.user?.email ?? '')
    })
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    const updates: { email?: string; password?: string } = {}
    if (newEmail && newEmail !== email) updates.email = newEmail
    if (newPassword) updates.password = newPassword

    if (Object.keys(updates).length === 0) {
      setError('変更する内容がありません')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser(updates)
    if (error) {
      setError('更新に失敗しました: ' + error.message)
    } else {
      setMessage('更新しました！')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-700">アカウント設定</h1>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
          <h2 className="font-bold text-gray-600 text-sm">メールアドレス変更</h2>
          <div>
            <label className="block text-sm text-gray-500 mb-1">メールアドレス</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
          <h2 className="font-bold text-gray-600 text-sm">パスワード変更</h2>
          <div>
            <label className="block text-sm text-gray-500 mb-1">新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="変更する場合のみ入力"
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">新しいパスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力"
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
        </div>

        {message && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl px-4 py-3 text-sm">
            <Check size={16} /> {message}
          </div>
        )}
        {error && (
          <p className="text-red-500 bg-red-50 rounded-xl px-4 py-3 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white rounded-2xl py-4 font-bold transition-colors"
        >
          {loading ? '更新中...' : '更新する'}
        </button>
      </form>
    </div>
  )
}
