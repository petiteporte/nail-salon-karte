'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function EditMenuPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [couponPrice, setCouponPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [category, setCategory] = useState('menu')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('menus').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setName(data.name || '')
        setPrice(data.price?.toString() || '')
        setCouponPrice(data.coupon_price?.toString() || '')
        setMinPrice(data.min_price?.toString() || '')
        setCategory(data.category || 'menu')
      }
      setLoading(false)
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('menus').update({
      name,
      price: price ? parseInt(price) : null,
      coupon_price: couponPrice ? parseInt(couponPrice) : null,
      min_price: minPrice ? parseInt(minPrice) : null,
      category,
    }).eq('id', id)
    setSaving(false)
    router.push('/admin/menus')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/menus" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">メニューを編集</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">通常価格（円）</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">クーポン価格（円）</label>
              <input type="number" value={couponPrice} onChange={e => setCouponPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低価格（円）</label>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
              <Link href="/admin/menus"
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
