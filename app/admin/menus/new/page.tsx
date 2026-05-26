'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  menu: 'メニュー',
  option: 'オプション',
  discount: '割引',
}

export default function NewMenuPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'menu'
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [couponPrice, setCouponPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('menus').insert([{
      name: name.trim(),
      price: price ? parseInt(price) : null,
      coupon_price: couponPrice ? parseInt(couponPrice) : null,
      min_price: minPrice ? parseInt(minPrice) : null,
      sort_order: 999,
      category,
    }])
    router.push('/admin/menus')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/menus" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-700">{CATEGORY_LABELS[category] ?? 'メニュー'}追加</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">メニュー名 *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="ジェルネイル（手）"
              className="w-full border border-pink-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-300"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '定価', value: price, set: setPrice, placeholder: '8000' },
              { label: 'クーポン価格', value: couponPrice, set: setCouponPrice, placeholder: '6000' },
              { label: '公式最安値', value: minPrice, set: setMinPrice, placeholder: '5500' },
            ].map(({ label, value, set, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">¥</span>
                  <input type="number" value={value} onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full border border-pink-100 rounded-xl pl-6 pr-2 py-3 text-sm outline-none focus:border-pink-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" disabled={saving || !name.trim()}
          className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white rounded-2xl py-4 font-bold transition-colors">
          {saving ? '保存中...' : '保存する'}
        </button>
      </form>
    </div>
  )
}
