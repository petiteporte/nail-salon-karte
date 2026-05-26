'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Menu {
  id: string
  name: string
  price?: number
  category: string
}

interface Props {
  customerId: string
  treatmentId?: string
}

export default function TreatmentForm({ customerId, treatmentId }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [menu, setMenu] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [menus, setMenus] = useState<Menu[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('menus').select('*').order('category').then(({ data }) => {
      setMenus(data || [])
    })
    if (treatmentId) {
      supabase.from('treatments').select('*').eq('id', treatmentId).single().then(({ data }) => {
        if (data) {
          setDate(data.date || '')
          setMenu(data.menu || '')
          setPrice(data.price?.toString() || '')
          setNotes(data.notes || '')
        }
      })
    }
  }, [treatmentId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      customer_id: customerId,
      date,
      menu,
      price: price ? parseInt(price) : null,
      notes,
    }
    if (treatmentId) {
      await supabase.from('treatments').update(payload).eq('id', treatmentId)
    } else {
      await supabase.from('treatments').insert([payload])
    }
    setSaving(false)
    router.push(`/customers/${customerId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メニュー</label>
        {menus.length > 0 ? (
          <select value={menu} onChange={e => {
            setMenu(e.target.value)
            const selected = menus.find(m => m.name === e.target.value)
            if (selected?.price) setPrice(selected.price.toString())
          }} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300">
            <option value="">選択してください</option>
            {menus.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        ) : (
          <input type="text" value={menu} onChange={e => setMenu(e.target.value)}
            placeholder="施術内容を入力"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">金額（円）</label>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)}
          placeholder="例: 5000"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          placeholder="施術の詳細やお客様の要望など"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
        <button type="button" onClick={() => router.push(`/customers/${customerId}`)}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300">
          キャンセル
        </button>
      </div>
    </form>
  )
}
