'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [furigana, setFurigana] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('customers').insert([{ name, furigana, phone, email, birthday, notes }])
    setSaving(false)
    router.push('/customers')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/customers" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">顧客を追加</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">お名前 *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="例：田中 花子"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ふりがな</label>
              <input type="text" value={furigana} onChange={e => setFurigana(e.target.value)}
                placeholder="例：たなか はなこ"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="例：090-1234-5678"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="例：hanako@example.com"
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
                placeholder="アレルギー、好み、注意事項など"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
              <Link href="/customers"
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
