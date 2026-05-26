'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Plus, X, Camera } from 'lucide-react'

interface Menu {
  id: string
  name: string
  price?: number
  coupon_price?: number
  category: string
}

interface Staff {
  id: string
  name: string
}

interface SelectedItem {
  id: string
  name: string
  price: number
}

interface Props {
  customerId: string
  treatmentId?: string
}

export default function TreatmentForm({ customerId, treatmentId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 基本情報
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [visitType, setVisitType] = useState<'new' | 'repeat'>('repeat')
  const [hasRemoval, setHasRemoval] = useState(false)
  const [notes, setNotes] = useState('')

  // メニュー・オプション等
  const [menuItems, setMenuItems] = useState<SelectedItem[]>([])
  const [optionItems, setOptionItems] = useState<SelectedItem[]>([])
  const [retailItems, setRetailItems] = useState<SelectedItem[]>([])
  const [discountItems, setDiscountItems] = useState<SelectedItem[]>([])

  // カラー・スタッフ
  const [colors, setColors] = useState('')
  const [staffId, setStaffId] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // マスタデータ
  const [allMenus, setAllMenus] = useState<Menu[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // マスタデータ取得
    supabase.from('menus').select('*').order('sort_order').then(({ data }) => {
      setAllMenus(data || [])
    })
    supabase.from('staff').select('*').order('sort_order').then(({ data }) => {
      setStaffList(data || [])
    })

    // 編集時は既存データ取得
    if (treatmentId) {
      supabase.from('treatments').select('*').eq('id', treatmentId).single().then(({ data }) => {
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
          setPhotoUrls(data.photo_urls || [])
          setNotes(data.notes || '')
        }
      })
    }
  }, [treatmentId])

  const calcTotal = () => {
    const menuTotal = menuItems.reduce((s, i) => s + (i.price || 0), 0)
    const optionTotal = optionItems.reduce((s, i) => s + (i.price || 0), 0)
    const retailTotal = retailItems.reduce((s, i) => s + (i.price || 0), 0)
    const discountTotal = discountItems.reduce((s, i) => s + (i.price || 0), 0)
    return menuTotal + optionTotal + retailTotal - discountTotal
  }

  const addItem = (
    menu: Menu,
    setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>,
    usePrice: 'price' | 'coupon_price' = 'price'
  ) => {
    setter(prev => [...prev, {
      id: menu.id,
      name: menu.name,
      price: (usePrice === 'coupon_price' ? menu.coupon_price : menu.price) || menu.price || 0
    }])
  }

  const removeItem = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingPhoto(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const fileName = `${customerId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('treatment-photos')
        .upload(fileName, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('treatment-photos')
          .getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    setPhotoUrls(prev => [...prev, ...urls])
    setUploadingPhoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      customer_id: customerId,
      date,
      visit_type: visitType,
      has_removal: hasRemoval,
      menu_items: menuItems,
      option_items: optionItems,
      retail_items: retailItems,
      discount_items: discountItems,
      colors,
      staff_id: staffId || null,
      photo_urls: photoUrls,
      notes,
      total_price: calcTotal(),
      // 旧フィールドとの互換性
      menu: menuItems.map(i => i.name).join('、'),
      price: calcTotal(),
    }
    if (treatmentId) {
      await supabase.from('treatments').update(payload).eq('id', treatmentId)
    } else {
      await supabase.from('treatments').insert([payload])
    }
    setSaving(false)
    router.push(`/customers/${customerId}`)
  }

  const menus = allMenus.filter(m => m.category === 'menu')
  const options = allMenus.filter(m => m.category === 'option')
  const retails = allMenus.filter(m => m.category === 'retail')
  const discounts = allMenus.filter(m => m.category === 'discount')

  const ItemSelector = ({
    label,
    items,
    selected,
    setter,
    useCoupon = false,
  }: {
    label: string
    items: Menu[]
    selected: SelectedItem[]
    setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>
    useCoupon?: boolean
  }) => (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {items.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => addItem(m, setter, useCoupon ? 'coupon_price' : 'price')}
              className="text-xs bg-pink-50 text-pink-600 border border-pink-200 rounded px-2 py-1 hover:bg-pink-100"
            >
              {m.name} ¥{((useCoupon ? m.coupon_price : m.price) || m.price || 0).toLocaleString()}
            </button>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="space-y-1">
          {selected.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
              <span className="text-sm">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-pink-500">¥{item.price.toLocaleString()}</span>
                <button type="button" onClick={() => removeItem(idx, setter)} className="text-gray-400 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selected.length === 0 && items.length === 0 && (
        <div className="text-xs text-gray-400">（マスタに{label}がありません）</div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 日付 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📅 日付</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300" />
      </div>

      {/* 来客区分 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">👤 来客区分</label>
        <div className="flex gap-3">
          <button type="button"
            onClick={() => setVisitType('new')}
            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${visitType === 'new' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500'}`}>
            新規
          </button>
          <button type="button"
            onClick={() => setVisitType('repeat')}
            className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${visitType === 'repeat' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500'}`}>
            リピート
          </button>
        </div>
      </div>

      {/* 付け替えオフ */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setHasRemoval(!hasRemoval)}
            className={`w-12 h-6 rounded-full transition-colors ${hasRemoval ? 'bg-pink-400' : 'bg-gray-300'} relative`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasRemoval ? 'left-7' : 'left-1'}`} />
          </div>
          <span className="text-sm font-medium text-gray-700">🗑️ 付け替えオフあり</span>
        </label>
      </div>

      {/* 施術メニュー */}
      <ItemSelector label="💅 施術メニュー" items={menus} selected={menuItems} setter={setMenuItems} useCoupon={true} />

      {/* オプション */}
      <ItemSelector label="✨ オプション" items={options} selected={optionItems} setter={setOptionItems} />

      {/* 店販 */}
      <ItemSelector label="🛍️ 店販" items={retails} selected={retailItems} setter={setRetailItems} />

      {/* 割引 */}
      <ItemSelector label="🏷️ 割引" items={discounts} selected={discountItems} setter={setDiscountItems} />

      {/* 合計金額 */}
      <div className="bg-pink-50 rounded-lg p-3 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">💴 合計金額</span>
        <span className="text-lg font-bold text-pink-500">¥{calcTotal().toLocaleString()}</span>
      </div>

      {/* 使用カラー */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">🎨 使用カラー</label>
        <textarea value={colors} onChange={e => setColors(e.target.value)} rows={2}
          placeholder="例: ベース：ジェリーピンク、アート：ホワイト＆ゴールド"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" />
      </div>

      {/* 担当スタッフ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">👩 担当スタッフ</label>
        <select value={staffId} onChange={e => setStaffId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300">
          <option value="">選択してください</option>
          {staffList.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* 施術写真 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">📷 施術写真</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {photoUrls.map((url, idx) => (
            <div key={idx} className="relative">
              <img src={url} alt="施術写真" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
              <button type="button"
                onClick={() => setPhotoUrls(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-pink-300 hover:text-pink-400">
            <Camera className="w-6 h-6" />
            <span className="text-xs mt-1">{uploadingPhoto ? '...' : '追加'}</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📝 メモ</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="お客様の要望、アレルギー、次回提案など"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" />
      </div>

      {/* ボタン */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="flex-1 bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 disabled:opacity-50 font-medium">
          {saving ? '保存中...' : '保存する'}
        </button>
        <button type="button" onClick={() => router.push(`/customers/${customerId}`)}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300">
          キャンセル
        </button>
      </div>
    </form>
  )
}
