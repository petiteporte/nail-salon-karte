'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function CustomerEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('customers').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setName(data.name || '')
        setPhone(data.phone || '')
        setEmail(data.email || '')
        setBirthday(data.birthday || '')
        setNotes(data.notes || '')
      }
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('customers').update({
      name, phone, email, birthday, notes
    }).eq('id', id)
    setSaving(false)
    router.push(`/customers/${id}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/customers/${id}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">顧客情報を編集</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前 *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">誕生日</label>
              <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
              <Link href={`/customers/${id}`}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 text-center">
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
