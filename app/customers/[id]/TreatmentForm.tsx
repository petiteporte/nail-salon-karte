'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SelectedItem = { id: string; name: string; price: number; qty: number }
type MenuRow = { id: string; name: string; price: number; category: string }
type StaffRow = { id: string; name: string }

interface Props {
  customerId: string
  treatmentId?: string
}

// ============================================================
// Sectionコンポーネント - TreatmentForm の外に定義（重要）
// ============================================================
function ItemRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: SelectedItem
  onQtyChange: (id: string, delta: number) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700 flex-1">{item.name}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQtyChange(item.id, -1)}
          className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-lg leading-none hover:bg-gray-200"
        >−</button>
        <span className="w-6 text-center text-sm">{item.qty}</span>
        <button
          type="button"
          onClick={() => onQtyChange(item.id, 1)}
          className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-lg leading-none hover:bg-pink-200"
        >+</button>
        <span className="w-16 text-right text-sm text-gray-600">¥{(item.price * item.qty).toLocaleString()}</span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="ml-1 text-gray-300 hover:text-red-400 text-lg"
        >×</button>
      </div>
    </div>
  )
}

function MenuSection({
  label,
  allItems,
  selected,
  onToggle,
  onQtyChange,
  onRemove,
}: {
  label: string
  allItems: MenuRow[]
  selected: SelectedItem[]
  onToggle: (item: MenuRow) => void
  onQtyChange: (id: string, delta: number) => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  if (allItems.length === 0) return null
  const selectedIds = new Set(selected.map(s => s.id))

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        <span>{label}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'} {selected.length > 0 ? `(${selected.length})` : ''}</span>
      </button>

      {open && (
        <div className="px-4 py-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {allItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item)}
                className={`py-2 px-3 rounded-lg text-xs text-left border transition-colors ${
                  selectedIds.has(item.id)
                    ? 'border-pink-400 bg-pink-50 text-pink-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200'
                }`}
              >
                <div className="font-medium">{item.name}</div>
                <div className="text-gray-400">¥{item.price.toLocaleString()}</div>
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-gray-100 pt-2">
              {selected.map(item => (
                <ItemRow key={item.id} item={item} onQtyChange={onQtyChange} onRemove={onRemove} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// TreatmentForm メインコンポーネント
// ============================================================
export default function TreatmentForm({ customerId, treatmentId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 基本情報
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [visitType, setVisitType] = useState<'new' | 'repeat'>('repeat')
  const [hasRemoval, setHasRemoval] = useState(false)
  const [colors, setColors] = useState('')
  const [staffId, setStaffId] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  // メニュー選択
  const [menuItems, setMenuItems] = useState<SelectedItem[]>([])
  const [optionItems, setOptionItems] = useState<SelectedItem[]>([])
  const [retailItems, setRetailItems] = useState<SelectedItem[]>([])
  const [discountItems, setDiscountItems] = useState<SelectedItem[]>([])

  // マスタデータ
  const [allMenus, setAllMenus] = useState<MenuRow[]>([])
  const [allOptions, setAllOptions] = useState<MenuRow[]>([])
  const [allRetails, setAllRetails] = useState<MenuRow[]>([])
  const [allDiscounts, setAllDiscounts] = useState<MenuRow[]>([])
  const [staffList, setStaffList] = useState<StaffRow[]>([])

  const [loading, setLoading] = useState(false)

  // マスタデータ読み込み
  useEffect(() => {
    const load = async () => {
      const [menusRes, staffRes] = await Promise.all([
        supabase.from('menus').select('*').order('category').order('name'),
        supabase.from('staff').select('id, name').order('name'),
      ])
      const menus = menusRes.data || []
      setAllMenus(menus.filter(m => m.category === 'menu'))
      setAllOptions(menus.filter(m => m.category === 'option'))
      setAllRetails(menus.filter(m => m.category === 'retail'))
      setAllDiscounts(menus.filter(m => m.category === 'discount'))
      setStaffList(staffRes.data || [])
    }
    load()
  }, [])

  // 編集時の既存データ読み込み
  useEffect(() => {
    if (!treatmentId) return
    const load = async () => {
      const { data } = await supabase.from('treatments').select('*').eq('id', treatmentId).single()
      if (data) {
        setDate(data.date || '')
        setVisitType(data.visit_type || 'repeat')
        setHasRemoval(data.has_removal || false)
        setMenuItems(data.menu_items || [])
        setOptionItems(data.option_items || [])
        setRetailItems(data.retail_items || [])
        setDiscountItems(data.discount_items || [])
        setColors(data.colors || '')
        setStaffId(data.staff_id || '')
        setNotes(data.notes || '')
        setPhotoUrls(data.photo_urls || [])
      }
    }
    load()
  }, [treatmentId])

  // アイテム操作
  const toggleItem = (setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>) => (item: MenuRow) => {
    setter(prev => {
      const exists = prev.find(s => s.id === item.id)
      if (exists) return prev.filter(s => s.id !== item.id)
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }]
    })
  }

  const changeQty = (setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>) => (id: string, delta: number) => {
    setter(prev => prev.map(s => s.id === id ? { ...s, qty: Math.max(1, s.qty + delta) } : s))
  }

  const removeItem = (setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>) => (id: string) => {
    setter(prev => prev.filter(s => s.id !== id))
  }

  // 合計金額
  const calcTotal = (items: SelectedItem[]) => items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const total = calcTotal(menuItems) + calcTotal(optionItems) + calcTotal(retailItems) - calcTotal(discountItems)

  // 写真アップロード
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const fileName = `${customerId}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('treatment-photos').upload(fileName, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('treatment-photos').getPublicUrl(fileName)
        urls.push(urlData.publicUrl)
      }
    }
    setPhotoUrls(prev => [...prev, ...urls])
    setUploading(false)
  }

  // 保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const menuStr = menuItems.map(m => m.name).join(', ')
    const allSelectedStr = [
      ...menuItems.map(m => m.name),
      ...optionItems.map(m => m.name),
      ...retailItems.map(m => m.name),
    ].join(', ')

    const payload = {
      customer_id: customerId,
      date,
      services: allSelectedStr || menuStr || '',
      visit_type: visitType,
      has_removal: hasRemoval,
      menu_items: menuItems,
      option_items: optionItems,
      retail_items: retailItems,
      discount_items: discountItems,
      total_price: total,
      colors,
      staff_id: staffId || null,
      notes,
      photo_urls: photoUrls,
    }

    let error
    if (treatmentId) {
      const result = await supabase.from('treatments').update(payload).eq('id', treatmentId)
      error = result.error
    } else {
      const result = await supabase.from('treatments').insert(payload)
      error = result.error
    }

    setLoading(false)
    if (error) {
      alert('保存に失敗しました: ' + error.message)
    } else {
      router.push(`/customers/${customerId}`)
    }
  }

  const allSelected = [...menuItems, ...optionItems, ...retailItems, ...discountItems]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📅 日付</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>

      {/* 来客区分 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">👤 来客区分</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setVisitType('new')}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
              visitType === 'new'
                ? 'border-pink-400 bg-pink-50 text-pink-700'
                : 'border-gray-200 text-gray-500 bg-white hover:border-pink-200'
            }`}
          >
            新規
          </button>
          <button
            type="button"
            onClick={() => setVisitType('repeat')}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
              visitType === 'repeat'
                ? 'border-pink-400 bg-pink-50 text-pink-700'
                : 'border-gray-200 text-gray-500 bg-white hover:border-pink-200'
            }`}
          >
            リピート
          </button>
        </div>
      </div>

      {/* 付け替えオフ */}
      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
        <span className="text-sm font-medium text-gray-700">🪄 付け替えオフ</span>
        <button
          type="button"
          onClick={() => setHasRemoval(v => !v)}
          className={`w-14 h-7 rounded-full transition-colors relative ${hasRemoval ? 'bg-pink-400' : 'bg-gray-300'}`}
          aria-label="付け替えオフ切替"
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasRemoval ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
        <span className="text-sm ml-2 text-gray-500">{hasRemoval ? 'あり' : 'なし'}</span>
      </div>

      {/* 施術メニュー */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">💅 施術メニュー</label>
        <MenuSection
          label="メニューを選ぶ"
          allItems={allMenus}
          selected={menuItems}
          onToggle={toggleItem(setMenuItems)}
          onQtyChange={changeQty(setMenuItems)}
          onRemove={removeItem(setMenuItems)}
        />
      </div>

      {/* オプション */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">✨ オプション</label>
        <MenuSection
          label="オプションを選ぶ"
          allItems={allOptions}
          selected={optionItems}
          onToggle={toggleItem(setOptionItems)}
          onQtyChange={changeQty(setOptionItems)}
          onRemove={removeItem(setOptionItems)}
        />
      </div>

      {/* 店販 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">🛍 店販</label>
        <MenuSection
          label="店販を選ぶ"
          allItems={allRetails}
          selected={retailItems}
          onToggle={toggleItem(setRetailItems)}
          onQtyChange={changeQty(setRetailItems)}
          onRemove={removeItem(setRetailItems)}
        />
      </div>

      {/* 割引 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">🎁 割引</label>
        <MenuSection
          label="割引を選ぶ"
          allItems={allDiscounts}
          selected={discountItems}
          onToggle={toggleItem(setDiscountItems)}
          onQtyChange={changeQty(setDiscountItems)}
          onRemove={removeItem(setDiscountItems)}
        />
      </div>

      {/* 合計・明細 */}
      {allSelected.length > 0 && (
        <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">💰 明細</p>
          {menuItems.map(i => (
            <div key={i.id} className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{i.name} × {i.qty}</span>
              <span>¥{(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {optionItems.map(i => (
            <div key={i.id} className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{i.name} × {i.qty}</span>
              <span>¥{(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {retailItems.map(i => (
            <div key={i.id} className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{i.name} × {i.qty}</span>
              <span>¥{(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {discountItems.map(i => (
            <div key={i.id} className="flex justify-between text-sm text-red-500 mb-1">
              <span>{i.name} × {i.qty}</span>
              <span>−¥{(i.price * i.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-pink-300 mt-3 pt-3 flex justify-between font-bold text-gray-800">
            <span>合計</span>
            <span>¥{total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* 使用カラー */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">🎨 使用カラー</label>
        <input
          type="text"
          value={colors}
          onChange={e => setColors(e.target.value)}
          placeholder="例: OPI #52, ジェルネイル ピンク系"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>

      {/* 担当スタッフ */}
      {staffList.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">👩‍💼 担当スタッフ</label>
          <select
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            <option value="">選択してください</option>
            {staffList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* 備考 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📝 備考</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="特記事項があれば入力してください"
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
        />
      </div>

      {/* 施術写真 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">📸 施術写真</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-pink-300 hover:text-pink-500 transition-colors"
        >
          {uploading ? 'アップロード中...' : '写真を追加する'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        {photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {photoUrls.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '保存中...' : treatmentId ? '更新する' : '施術記録を保存する'}
      </button>

    </form>
  )
}
