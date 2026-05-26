'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Customer } from '@/lib/supabase'
import { Plus, Search, ChevronRight, TriangleAlert } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('customers')
      .select('*')
      .order('furigana', { ascending: true, nullsFirst: false })
      .order('name')
      .then(({ data }) => {
        setCustomers(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = customers.filter(c =>
    c.name.includes(search) ||
    (c.furigana && c.furigana.includes(search)) ||
    (c.phone && c.phone.includes(search))
  )

  // 要注意人物を先頭に
  const sorted = [
    ...filtered.filter(c => c.caution),
    ...filtered.filter(c => !c.caution),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-700">顧客一覧</h1>
        <Link href="/customers/new" className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-4 py-2 text-sm font-bold flex items-center gap-1 transition-colors">
          <Plus size={16} />追加
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input type="text" placeholder="名前・ふりがな・電話番号で検索"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-pink-100 rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:border-pink-300"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">顧客が登録されていません</p>
          <Link href="/customers/new" className="mt-4 inline-block text-pink-400 text-sm">最初の顧客を追加する →</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map(customer => (
            <li key={customer.id}>
              <Link href={`/customers/${customer.id}`}
                className={`rounded-2xl p-4 shadow-sm border flex items-center justify-between transition-colors ${
                  customer.caution
                    ? 'bg-red-50 border-red-200 hover:border-red-300'
                    : 'bg-white border-pink-50 hover:border-pink-200'
                }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {customer.caution && <TriangleAlert size={15} className="text-red-500 shrink-0" />}
                    <p className={`font-bold ${customer.caution ? 'text-red-700' : 'text-gray-700'}`}>{customer.name}</p>
                    {customer.furigana && <p className="text-xs text-gray-400">{customer.furigana}</p>}
                  </div>
                  {customer.phone && <p className="text-xs text-gray-400 mt-0.5">{customer.phone}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customer.caution && (
                      <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-bold">要注意</span>
                    )}
                    {customer.allergies && (
                      <span className="text-xs bg-orange-50 text-orange-400 px-2 py-0.5 rounded-full">
                        アレルギー: {customer.allergies}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0 ml-2" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
