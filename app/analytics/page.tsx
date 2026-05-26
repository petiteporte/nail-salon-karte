'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TrendingUp } from 'lucide-react'

type MonthStats = {
  month: string   // YYYY-MM
  label: string   // M月
  revenue: number
  treatmentCount: number
  newCustomers: number
  repeatCustomers: number
  totalCustomers: number
  repeatRate: number
}

type Period = 3 | 6 | 12

// 月ラベル "2024-05" → "5月"
const toLabel = (ym: string) => `${parseInt(ym.split('-')[1])}月`

// 直近N月の YYYY-MM リストを返す（古い順）
const getMonthRange = (n: Period): string[] => {
  const list: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return list
}

// シンプルな棒グラフ
function BarChart({
  data, getValue, color, unit = '', formatVal,
}: {
  data: MonthStats[]
  getValue: (s: MonthStats) => number
  color: string
  unit?: string
  formatVal?: (v: number) => string
}) {
  const values = data.map(getValue)
  const max = Math.max(...values, 1)
  const fmt = formatVal ?? ((v: number) => v.toLocaleString())

  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.map((s, i) => {
        const val = values[i]
        const pct = (val / max) * 100
        return (
          <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-400 leading-none">
              {val > 0 ? (unit === '¥' ? `¥${fmt(val)}` : `${fmt(val)}${unit}`) : ''}
            </span>
            <div className="w-full flex items-end" style={{ height: '72px' }}>
              <div
                className={`w-full rounded-t-md transition-all ${color}`}
                style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// KPIカード
function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-pink-50 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-700">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(6)
  const [stats, setStats] = useState<MonthStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // 全施術を取得（新規/リピート判定のため全履歴必要）
      const { data: treatments } = await supabase
        .from('treatments')
        .select('id, customer_id, date, amount')
        .order('date', { ascending: true })

      if (!treatments) { setLoading(false); return }

      // 顧客ごとの最初の施術月を記録
      const firstMonthByCustomer: Record<string, string> = {}
      for (const t of treatments) {
        const ym = t.date.slice(0, 7)
        if (!firstMonthByCustomer[t.customer_id]) {
          firstMonthByCustomer[t.customer_id] = ym
        }
      }

      const months = getMonthRange(period)

      const result: MonthStats[] = months.map(ym => {
        const monthTreatments = treatments.filter(t => t.date.slice(0, 7) === ym)
        const revenue = monthTreatments.reduce((s, t) => s + (t.amount ?? 0), 0)
        const treatmentCount = monthTreatments.length

        // この月に来た顧客（重複除去）
        const customersThisMonth = [...new Set(monthTreatments.map(t => t.customer_id))]
        const totalCustomers = customersThisMonth.length

        // 新規 = この月が初回
        const newCustomers = customersThisMonth.filter(
          cid => firstMonthByCustomer[cid] === ym
        ).length

        // リピーター = 初回より後の月に来店
        const repeatCustomers = customersThisMonth.filter(
          cid => firstMonthByCustomer[cid] !== ym
        ).length

        const repeatRate = totalCustomers > 0
          ? Math.round((repeatCustomers / totalCustomers) * 100)
          : 0

        return {
          month: ym,
          label: toLabel(ym),
          revenue,
          treatmentCount,
          newCustomers,
          repeatCustomers,
          totalCustomers,
          repeatRate,
        }
      })

      setStats(result)
      setLoading(false)
    }
    load()
  }, [period])

  const latest = stats[stats.length - 1]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-pink-400" />
          <h1 className="text-xl font-bold text-gray-700">売上・統計</h1>
        </div>
        {/* 期間切り替え */}
        <div className="flex gap-1 bg-pink-50 rounded-xl p-1">
          {([3, 6, 12] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                period === p ? 'bg-white text-pink-500 shadow-sm' : 'text-gray-400 hover:text-pink-400'
              }`}>
              {p}ヶ月
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : (
        <>
          {/* 直近月のKPI */}
          {latest && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{latest.label}（直近）</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <KpiCard label="売上" value={`¥${latest.revenue.toLocaleString()}`} />
                <KpiCard label="施術数" value={`${latest.treatmentCount}件`} />
                <KpiCard label="リピ率" value={`${latest.repeatRate}%`}
                  sub={`${latest.totalCustomers}名来店`} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <KpiCard label="新規" value={`${latest.newCustomers}名`} />
                <KpiCard label="リピーター" value={`${latest.repeatCustomers}名`} />
              </div>
            </div>
          )}

          {/* 売上グラフ */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
            <p className="text-sm font-bold text-gray-700 mb-4">売上</p>
            <BarChart
              data={stats}
              getValue={s => s.revenue}
              color="bg-pink-400"
              unit="¥"
              formatVal={v => v >= 10000
                ? `${Math.floor(v / 1000)}k`
                : v.toLocaleString()}
            />
          </div>

          {/* 施術数グラフ */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
            <p className="text-sm font-bold text-gray-700 mb-4">施術数</p>
            <BarChart
              data={stats}
              getValue={s => s.treatmentCount}
              color="bg-rose-300"
              unit="件"
            />
          </div>

          {/* 新規 / リピーター グラフ（積み上げ） */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
            <p className="text-sm font-bold text-gray-700 mb-1">新規 / リピーター</p>
            <div className="flex items-center gap-4 mb-4">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-sm bg-amber-300 inline-block" />新規
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <span className="w-3 h-3 rounded-sm bg-pink-400 inline-block" />リピーター
              </span>
            </div>
            {/* 積み上げ棒グラフ */}
            <div className="flex items-end gap-1.5 h-28 w-full">
              {stats.map(s => {
                const total = s.newCustomers + s.repeatCustomers
                const maxTotal = Math.max(...stats.map(x => x.newCustomers + x.repeatCustomers), 1)
                const barH = (total / maxTotal) * 72
                const repeatH = total > 0 ? (s.repeatCustomers / total) * barH : 0
                const newH = barH - repeatH
                return (
                  <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400 leading-none">
                      {total > 0 ? `${total}名` : ''}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{ height: '72px' }}>
                      <div className="w-full bg-pink-400 rounded-t-none" style={{ height: repeatH }} />
                      <div className="w-full bg-amber-300 rounded-t-md" style={{ height: newH }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* リピ率グラフ */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
            <p className="text-sm font-bold text-gray-700 mb-4">リピ率</p>
            <BarChart
              data={stats}
              getValue={s => s.repeatRate}
              color="bg-violet-400"
              unit="%"
            />
          </div>
        </>
      )}
    </div>
  )
}
