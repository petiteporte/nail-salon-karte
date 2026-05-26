'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react'

type Menu = { id: string; name: string; price: number | null; coupon_price: number | null; min_price: number | null; sort_order: number; category: string }
type Tab = 'off' | 'menu' | 'option' | 'retail' | 'discount'

const TAB_LABELS: Record<Tab, string> = {
  off: '付け替えオフ',
  menu: 'メニュー',
  option: 'オプション',
  retail: '店販',
  discount: '割引',
}

export default function AdminMenusPage() {
  const [allMenus, setAllMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('menu')

  const load = () => {
    supabase.from('menus').select('*').order('sort_order').then(({ data }) => {
      setAllMenus(data ?? [])
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const menus = allMenus.filter(m => m.category === activeTab).sort((a, b) => a.sort_order - b.sort_order)

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    await supabase.from('menus').delete().eq('id', id)
    load()
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const filtered = [...menus]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= filtered.length) return

    // 配列内で位置を入れ替えてから 0,1,2… と連番で振り直す
    ;[filtered[index], filtered[targetIndex]] = [filtered[targetIndex], filtered[index]]
    const updates = filtered.map((item, i) => ({ id: item.id, sort_order: i }))

    // ローカル状態を更新
    const map = new Map(updates.map(u => [u.id, u.sort_order]))
    setAllMenus(prev => prev.map(m => map.has(m.id) ? { ...m, sort_order: map.get(m.id)! } : m))

    // DB保存
    await Promise.all(updates.map(u =>
      supabase.from('menus').update({ sort_order: u.sort_order }).eq('id', u.id)
    ))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-bold text-gray-700">メニュー管理</h1>
        <Link href={`/admin/menus/new?category=${activeTab}`}
          className="ml-auto bg-pink-400 hover:bg-pink-500 text-white rounded-full px-4 py-2 text-sm font-bold flex items-center gap-1">
          <Plus size={16} />追加
        </Link>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-pink-50 rounded-2xl p-1">
        {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab
                ? 'bg-white text-pink-500 shadow-sm'
                : 'text-gray-400 hover:text-pink-400'
            }`}>
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-8">読み込み中...</p>
      ) : menus.length === 0 ? (
        <p className="text-center text-gray-400 py-8">登録がありません</p>
      ) : (
        <ul className="space-y-2">
          {menus.map((menu, index) => (
            <li key={menu.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex items-center gap-2">
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  className="text-gray-300 hover:text-pink-400 disabled:opacity-20 transition-colors">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === menus.length - 1}
                  className="text-gray-300 hover:text-pink-400 disabled:opacity-20 transition-colors">
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-700">{menu.name}</p>
                <div className="flex gap-2 flex-wrap mt-0.5">
                  {menu.price != null && (
                    <p className="text-xs text-gray-400">定価 ¥{menu.price.toLocaleString()}</p>
                  )}
                  {menu.coupon_price != null && (
                    <p className="text-xs text-pink-400">クーポン ¥{menu.coupon_price.toLocaleString()}</p>
                  )}
                  {menu.min_price != null && (
                    <p className="text-xs text-blue-400">最安値 ¥{menu.min_price.toLocaleString()}</p>
                  )}
                </div>
              </div>

              <Link href={`/admin/menus/${menu.id}/edit`}
                className="text-gray-300 hover:text-pink-400 transition-colors p-1">
                <Pencil size={16} />
              </Link>
              <button onClick={() => handleDelete(menu.id)}
                className="text-gray-300 hover:text-red-400 transition-colors p-1">
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
