'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

export default function NewUserPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください')
      return
    }
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
      setSaving(false)
    } else {
      router.push('/admin/users')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-700">スタッフ追加</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="staff@example.com"
              required
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">パスワード（確認）</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="もう一度入力"
              required
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 bg-red-50 rounded-xl px-4 py-3 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white rounded-2xl py-4 font-bold transition-colors"
        >
          {saving ? '作成中...' : 'アカウントを作成する'}
        </button>
      </form>
    </div>
  )
}
