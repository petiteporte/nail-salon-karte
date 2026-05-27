'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { X, Camera, ChevronDown, ChevronUp } from 'lucide-react'

interface Menu { id: string; name: string; price?: number; coupon_price?: number; category: string }
interface Staff { id: string; name: string }
interface SelectedItem { id: string; name: string; price: number }

function Section({
  label, items, selected, setter, useCoupon = false, isOpen, onToggle
}: {
  label: string; items: Menu[]; selected: SelectedItem[]
  setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>
  useCoupon?: boolean; isOpen: boolean; onToggle: () => void
}) {
  const addItem = (menu: Menu) => {
    setter(prev => [...prev, {
      id: menu.id, name: menu.name,
      price: (useCoupon ? menu.coupon_price : menu.price) ?? menu.price ?? 0
    }])
  }
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 active:bg-gray-100">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">{selected.length}件</span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-3">
              {items.map(m => {
                const price = (useCoupon ? m.coupon_price : m.price) ?? m.price ?? 0
                return (
                  <button key={m.id} type="button" onClick={() => addItem(m)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-pink-50 hover:border-pink-300 active:bg-pink-100 transition-colors text-left">
                    <div className="text-sm">{m.name}</div>
                    <div className="text-xs text-pink-500 mt-0.5">¥{price.toLocaleString()}</div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 pt-3">（マスタに登録がありません）</p>
          )}
        </div>
      )}
    </div>
  )
}

interface Props { customerId: string; treatmentId?: string }

export default function TreatmentForm({ customerId, treatmentId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [visitType, setVisitType] = useState<'new' | 'repeat'>('repeat')
  const [hasRemoval, setHasRemoval] = useState(false)
  const [menuItems, setMenuItems] = useState<SelectedItem[]>([])
  const [optionItems, setOptionItems] = useState<SelectedItem[]>([])
  const [retailItems, setRetailItems] = useState<SelectedItem[]>([])
  const [discountItems, setDiscountItems] = useState<SelectedItem[]>([])
  const [colors, setColors] = useState('')
  const [staffId, setStaffId] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [notes, setNotes] = useState('')
  const [allMenus, setAllMenus] = useState<Menu[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [saving, setSaving] = useState(false)
  const [openSection, setOpenSection] = useState<string>('menu')

  useEffect(() => {
    supabase.from('menus').select('*').order('sort_order').then(({ data }) => setAllMenus(data || []))
    supabase.from('staff').select('*').order('sort_order').then(({ data }) => setStaffList(data || []))
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
    const sum = (arr: SelectedItem[]) => arr.reduce((s, i) => s + (i.price || 0), 0)
    return sum(menuItems) + sum(optionItems) + sum(retailItems) - sum(discountItems)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadingPhoto(true)
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const fileName = `${customerId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('treatment-photos').upload(fileName, file, { upsert: true })
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('treatment-photos').getPublicUrl(data.path)
        setPhotoUrls(prev => [...prev, urlData.publicUrl])
      }
    }
    setUploadingPhoto(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const menuStr = menuItems.map(i => i.name).join('、')
    const total = calcTotal()
    const payload = {
      customer_id: customerId,
      date,
      services: menuStr || '',
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
      total_price: total,
    }
    let error = null
    if (treatmentId) {
      const res = await supabase.from('treatments').update(payload).eq('id', treatmentId)
      error = res.error
    } else {
      const res = await supabase.from('treatments').insert([payload])
      error = res.error
    }
    setSaving(false)
    if (!error) {
      router.push(`/customers/${customerId}`)
    } else {
      alert('保存に失敗しました: ' + error.message)
    }
  }

  const menus = allMenus.filter(m => m.category === 'menu')
  const options = allMenus.filter(m => m.category === 'option')
  const retails = allMenus.filter(m => m.category === 'retail')
  const discounts = allMenus.filter(m => m.category === 'discount')
  const hasAnySelected = menuItems.length + optionItems.length + retailItems.length + discountItems.length > 0
  const toggle = (id: string) => setOpenSection(prev => prev === id ? '' : id)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📅 日付</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">👤 来客区分</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => setVisitType('new')}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${visitType === 'new' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500 bg-white'}`}>
            新規
          </button>
          <button type="button" onClick={() => setVisitType('repeat')}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${visitType === 'repeat' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500 bg-white'}`}>
            リピート
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
        <span className="text-sm font-medium text-gray-700">🗑️ 付け替えオフ</span>
        <button type="button" onClick={() => setHasRemoval(v => !v)}
          className={`w-12 h-6 rounded-full transition-colors relative ${hasRemoval ? 'bg-pink-400' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasRemoval ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">💅 施術内容を選択（タップで追加）</p>
        <Section label="施術メニュー" items={menus} selected={menuItems} setter={setMenuItems} useCoupon={true}
          isOpen={openSection === 'menu'} onToggle={() => toggle('menu')} />
        <Section label="✨ オプション" items={options} selected={optionItems} setter={setOptionItems}
          isOpen={openSection === 'option'} onToggle={() => toggle('option')} />
        <Section label="🛍️ 店販" items={retails} selected={retailItems} setter={setRetailItems}
          isOpen={openSection === 'retail'} onToggle={() => toggle('retail')} />
        <Section label="🏷️ 割引" items={discounts} selected={discountItems} setter={setDiscountItems}
          isOpen={openSection === 'discount'} onToggle={() => toggle('discount')} />
      </div>

      {hasAnySelected && (
        <div className="bg-white border-2 border-pink-200 rounded-xl overflow-hidden">
          <div className="bg-pink-50 px-4 py-2 border-b border-pink-100">
            <p className="text-sm font-semibold text-pink-700">📋 選択した施術内容・明細</p>
          </div>
          <div className="divide-y divide-gray-100">
            {menuItems.map((item, idx) => (
              <div key={`m-${idx}`} className="flex items-center justify-between px-4 py-2.5">
                <div><span className="text-xs text-pink-400 mr-1">メニュー</span><span className="text-sm text-gray-700">{item.name}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">¥{item.price.toLocaleString()}</span>
                  <button type="button" onClick={() => setMenuItems(p => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {optionItems.map((item, idx) => (
              <div key={`o-${idx}`} className="flex items-center justify-between px-4 py-2.5">
                <div><span className="text-xs text-purple-400 mr-1">オプション</span><span className="text-sm text-gray-700">{item.name}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">¥{item.price.toLocaleString()}</span>
                  <button type="button" onClick={() => setOptionItems(p => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {retailItems.map((item, idx) => (
              <div key={`r-${idx}`} className="flex items-center justify-between px-4 py-2.5">
                <div><span className="text-xs text-blue-400 mr-1">店販</span><span className="text-sm text-gray-700">{item.name}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">¥{item.price.toLocaleString()}</span>
                  <button type="button" onClick={() => setRetailItems(p => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {discountItems.map((item, idx) => (
              <div key={`d-${idx}`} className="flex items-center justify-between px-4 py-2.5">
                <div><span className="text-xs text-green-500 mr-1">割引</span><span className="text-sm text-gray-700">{item.name}</span></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">-¥{item.price.toLocaleString()}</span>
                  <button type="button" onClick={() => setDiscountItems(p => p.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-400 p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-pink-50 px-4 py-3 border-t border-pink-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">💴 合計</span>
            <span className="text-xl font-bold text-pink-500">¥{calcTotal().toLocaleString()}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">🎨 使用カラー</label>
        <textarea value={colors} onChange={e => setColors(e.target.value)} rows={2}
          placeholder="例: ベース：ジェリーピンク"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">👩 担当スタッフ</label>
        <select value={staffId} onChange={e => setStaffId(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-pink-300">
          <option value="">選択してください</option>
          {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">📷 施術写真</label>
        <div className="flex flex-wrap gap-2">
          {photoUrls.map((url, idx) => (
            <div key={idx} className="relative">
              <img src={url} alt="施術写真" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
              <button type="button" onClick={() => setPhotoUrls(p => p.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 bg-red-400 text-white rounded-full w-5 h-5 flex items-center justify-center">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
            className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-pink-300 hover:text-pink-400">
            <Camera className="w-6 h-6" />
            <span className="text-xs mt-1">{uploadingPhoto ? '...' : '追加'}</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">📝 メモ</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="お客様の要望、アレルギー、次回提案など"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" />
      </div>

      <div className="flex gap-3 pt-2 pb-8">
        <button type="submit" disabled={saving}
          className="flex-1 bg-pink-500 text-white py-3 rounded-xl hover:bg-pink-600 active:bg-pink-700 disabled:opacity-50 font-medium text-sm">
          {saving ? '保存中...' : '保存する'}
        </button>
        <button type="button" onClick={() => router.push(`/customers/${customerId}`)}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 active:bg-gray-300 text-sm">
          キャンセル
        </button>
      </div>
    </form>
  )
}
