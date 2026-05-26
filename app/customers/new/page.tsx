'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, TriangleAlert } from 'lucide-react'
import Link from 'next/link'

export default function NewCustomerPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', furigana: '', phone: '', email: '', birthday: '',
    allergies: '', notes: '', caution: false, caution_reason: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('customers').insert([{
      name: form.name,
      furigana: form.furigana || null,
      phone: form.phone || null,
      email: form.email || null,
      birthday: form.birthday || null,
      allergies: form.allergies || null,
      notes: form.notes || null,
      caution: form.caution,
      caution_reason: form.caution_reason || null,
    }]).select().single()
    if (!error && data) router.push(`/customers/${data.id}`)
    setSaving(false)
  }

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={form[key] as string}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-white border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
      />
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-700">顧客追加</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
          {field('お名前 *', 'name', 'text', '山田 花子')}
          {field('ふりがな', 'furigana', 'text', 'やまだ はなこ')}
          {field('電話番号', 'phone', 'tel', '090-0000-0000')}
          {field('メールアドレス', 'email', 'email', 'example@email.com')}
          {field('生年月日', 'birthday', 'date')}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
          {field('アレルギー・注意事項', 'allergies', 'text', 'ジェル成分アレルギーなど')}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">メモ</label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="好みのデザイン、爪の状態など" rows={3}
              className="w-full bg-white border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300 resize-none"
            />
          </div>
        </div>

        {/* 要注意フラグ */}
        <div className={`rounded-2xl p-5 shadow-sm border ${form.caution ? 'bg-red-50 border-red-200' : 'bg-white border-pink-50'}`}>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${form.caution ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}
              onClick={() => setForm(f => ({ ...f, caution: !f.caution }))}>
              {form.caution && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div className="flex items-center gap-2">
              <TriangleAlert size={18} className={form.caution ? 'text-red-500' : 'text-gray-300'} />
              <span className={`font-bold text-sm ${form.caution ? 'text-red-600' : 'text-gray-500'}`}>要注意人物</span>
            </div>
          </label>
          {form.caution && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-red-600 mb-1">理由</label>
              <textarea value={form.caution_reason}
                onChange={e => setForm(f => ({ ...f, caution_reason: e.target.value }))}
                placeholder="要注意の理由を入力してください"
                rows={3}
                className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300 resize-none"
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={saving || !form.name.trim()}
          className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white rounded-2xl py-4 font-bold transition-colors">
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>
    </div>
  )
}
