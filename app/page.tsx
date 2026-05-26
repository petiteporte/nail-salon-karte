'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Users, CalendarDays, ClipboardList, Plus } from 'lucide-react'

export default function Home() {
  const [customerCount, setCustomerCount] = useState(0)
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    supabase.from('customers').select('id', { count: 'exact', head: true })
      .then(({ count }) => setCustomerCount(count ?? 0))

    supabase.from('appointments')
      .select('*, customers(name)')
      .eq('date', today)
      .order('time')
      .then(({ data }) => setTodayAppointments(data ?? []))
  }, [today])

  const dateStr = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  })

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-pink-400">サロン管理ボード</h1>
        <p className="text-sm text-gray-400 mt-1">{dateStr}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
          <div className="flex items-center gap-2 text-pink-400 mb-1">
            <Users size={18} />
            <span className="text-sm">顧客数</span>
          </div>
          <p className="text-3xl font-bold text-gray-700">{customerCount}<span className="text-sm font-normal text-gray-400 ml-1">名</span></p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
          <div className="flex items-center gap-2 text-pink-400 mb-1">
            <CalendarDays size={18} />
            <span className="text-sm">本日の予約</span>
          </div>
          <p className="text-3xl font-bold text-gray-700">{todayAppointments.length}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <CalendarDays size={18} className="text-pink-400" />
            本日の予約
          </h2>
          <Link href="/calendar" className="text-xs text-pink-400">すべて見る</Link>
        </div>
        {todayAppointments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">本日の予約はありません</p>
        ) : (
          <ul className="space-y-3">
            {todayAppointments.map((apt) => (
              <li key={apt.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-bold text-pink-400 w-14">{apt.time}</span>
                <span className="text-sm text-gray-700">{apt.customers?.name}</span>
                {apt.service && <span className="text-xs text-gray-400">{apt.service}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/customers/new" className="bg-pink-400 hover:bg-pink-500 text-white rounded-2xl p-5 shadow-sm flex items-center gap-3 transition-colors">
          <Plus size={20} />
          <span className="font-bold">顧客追加</span>
        </Link>
        <Link href="/customers" className="bg-white hover:bg-pink-50 border border-pink-100 rounded-2xl p-5 shadow-sm flex items-center gap-3 transition-colors">
          <ClipboardList size={20} className="text-pink-400" />
          <span className="font-bold text-gray-700">カルテ一覧</span>
        </Link>
      </div>
    </div>
  )
}
