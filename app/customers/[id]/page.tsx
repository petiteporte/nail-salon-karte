'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Edit, Plus, Trash2 } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  birthday?: string
  notes?: string
  created_at: string
}

interface Treatment {
  id: string
  date: string
  menu?: string
  price?: number
  notes?: string
  photos?: string[]
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: cust }, { data: treats }] = await Promise.all([
      supabase.from('customers').select('*').eq('id', id).single(),
      supabase.from('treatments').select('*').eq('customer_id', id).order('date', { ascending: false })
    ])
    setCustomer(cust)
    setTreatments(treats || [])
    setLoading(false)
  }

  const deleteTreatment = async (tid: string) => {
    if (!confirm('この施術記録を削除しますか？')) return
    await supabase.from('treatments').delete().eq('id', tid)
    setTreatments(treatments.filter(t => t.id !== tid))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>
  if (!customer) return <div className="min-h-screen flex items-center justify-center text-gray-500">顧客が見つかりません</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/customers" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">{customer.name}</h1>
          </div>
          <Link href={`/customers/${id}/edit`} className="flex items-center gap-1 text-pink-500 hover:text-pink-600">
            <Edit className="w-4 h-4" />
            <span className="text-sm">編集</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">基本情報</h2>
          <div className="space-y-2 text-sm">
            {customer.phone && <div className="flex gap-2"><span className="text-gray-500 w-16">電話</span><span>{customer.phone}</span></div>}
            {customer.email && <div className="flex gap-2"><span className="text-gray-500 w-16">メール</span><span>{customer.email}</span></div>}
            {customer.birthday && <div className="flex gap-2"><span className="text-gray-500 w-16">誕生日</span><span>{customer.birthday}</span></div>}
            {customer.notes && <div className="flex gap-2"><span className="text-gray-500 w-16">メモ</span><span className="whitespace-pre-wrap">{customer.notes}</span></div>}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">施術履歴</h2>
          <Link href={`/customers/${id}/treatments/new`} className="flex items-center gap-1 bg-pink-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-pink-600">
            <Plus className="w-4 h-4" />
            追加
          </Link>
        </div>

        {treatments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-400 text-sm">施術記録がありません</div>
        ) : (
          <div className="space-y-3">
            {treatments.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <Link href={`/customers/${id}/treatments/${t.id}`} className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{t.date}</div>
                    {t.menu && <div className="text-sm text-gray-600 mt-1">{t.menu}</div>}
                    {t.price && <div className="text-sm text-pink-500 mt-1">¥{t.price.toLocaleString()}</div>}
                    {t.notes && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{t.notes}</div>}
                  </Link>
                  <button onClick={() => deleteTreatment(t.id)} className="ml-2 text-gray-300 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
