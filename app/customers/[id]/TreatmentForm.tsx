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

const REMOVAL_OPTIONS = [
  'リピーター様自店4週間以内オフ無料',
  'ご新規様他店オフ無料',
  'リピーター様他店オフ',
  'リピーター様自店4週間以上経過オフ',
]

// iOS対応ボタン共通スタイル
const tapStyle: React.CSSProperties = {
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none',
  touchAction: 'manipulation',
}

// ============================================================
// ItemRow
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ fontSize: '14px', color: '#374151', flex: 1 }}>{item.name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button type="button" style={{ ...tapStyle, width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', border: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563' }}
          onClick={() => onQtyChange(item.id, -1)}>−</button>
        <span style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{item.qty}</span>
        <button type="button" style={{ ...tapStyle, width: 28, height: 28, borderRadius: '50%', background: '#fce7f3', border: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#db2777' }}
          onClick={() => onQtyChange(item.id, 1)}>+</button>
        <span style={{ width: 64, textAlign: 'right', fontSize: 13, color: '#6b7280' }}>¥{(item.price * item.qty).toLocaleString()}</span>
        <button type="button" style={{ ...tapStyle, marginLeft: 4, background: 'none', border: 'none', fontSize: 18, color: '#d1d5db' }}
          onClick={() => onRemove(item.id)}>×</button>
      </div>
    </div>
  )
}

// ============================================================
// MenuSection
// ============================================================
function MenuSection({
  label, allItems, selected, onToggle, onQtyChange, onRemove,
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
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      <button type="button" style={{ ...tapStyle, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f9fafb', border: 'none', fontSize: 14, fontWeight: 500, color: '#374151' }}
        onClick={() => setOpen(v => !v)}>
        <span>{label}</span>
        <span style={{ color: '#9ca3af' }}>{open ? '▲' : '▼'}{selected.length > 0 ? ` (${selected.length}件)` : ''}</span>
      </button>
      {open && (
        <div style={{ padding: '8px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {allItems.map(item => (
              <button key={item.id} type="button"
                style={{ ...tapStyle, padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'left', border: selectedIds.has(item.id) ? '2px solid #f472b6' : '1px solid #e5e7eb', background: selectedIds.has(item.id) ? '#fdf2f8' : '#fff', color: selectedIds.has(item.id) ? '#be185d' : '#4b5563' }}
                onClick={() => onToggle(item)}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ color: '#9ca3af', marginTop: 2 }}>¥{item.price.toLocaleString()}</div>
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
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
// TreatmentForm
// ============================================================
export default function TreatmentForm({ customerId, treatmentId }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [visitType, setVisitType] = useState<'new' | 'repeat'>('repeat')
  const [removalOptions, setRemovalOptions] = useState<string[]>([])
  const [colors, setColors] = useState('')
  const [staffId, setStaffId] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const [menuItems, setMenuItems] = useState<SelectedItem[]>([])
  const [optionItems, setOptionItems] = useState<SelectedItem[]>([])
  const [retailItems, setRetailItems] = useState<SelectedItem[]>([])
  const [discountItems, setDiscountItems] = useState<SelectedItem[]>([])

  const [allMenus, setAllMenus] = useState<MenuRow[]>([])
  const [allOptions, setAllOptions] = useState<MenuRow[]>([])
  const [allRetails, setAllRetails] = useState<MenuRow[]>([])
  const [allDiscounts, setAllDiscounts] = useState<MenuRow[]>([])
  const [staffList, setStaffList] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [menusRes, staffRes] = await Promise.all([
        supabase.from('menus').select('*').order('category').order('name'),
        supabase.from('staff').select('id, name').order('name'),
      ])
      const menus = (menusRes.data || []) as MenuRow[]
      setAllMenus(menus.filter(m => m.category === 'menu'))
      setAllOptions(menus.filter(m => m.category === 'option'))
      setAllRetails(menus.filter(m => m.category === 'retail'))
      setAllDiscounts(menus.filter(m => m.category === 'discount'))
      setStaffList(staffRes.data || [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!treatmentId) return
    const load = async () => {
      const { data } = await supabase.from('treatments').select('*').eq('id', treatmentId).single()
      if (data) {
        setDate(data.date || '')
        setVisitType(data.visit_type || 'repeat')
        setRemovalOptions(Array.isArray(data.has_removal) ? data.has_removal : (data.has_removal ? [data.has_removal] : []))
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

  const toggleRemoval = (opt: string) => {
    setRemovalOptions(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    )
  }

  const toggleItem = (setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>) => (item: MenuRow) => {
    setter(prev => {
      const exists = prev.find(s => s.id === item.id)
      if (exists) return prev.filter(s => s.id !== item.id)
      return [...prev, { id: item.id, name: item.name, price: Number(item.price) || 0, qty: 1 }]
    })
  }

  const changeQty = (setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>) => (id: string, delta: number) => {
    setter(prev => prev.map(s => s.id === id ? { ...s, qty: Math.max(1, s.qty + delta) } : s))
  }

  const removeItem = (setter: React.Dispatch<React.SetStateAction<SelectedItem[]>>) => (id: string) => {
    setter(prev => prev.filter(s => s.id !== id))
  }

  const safeSum = (items: SelectedItem[]) =>
    items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.qty) || 1), 0)

  const total = safeSum(menuItems) + safeSum(optionItems) + safeSum(retailItems) - safeSum(discountItems)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const allSelectedStr = [
      ...menuItems.map(m => m.name),
      ...optionItems.map(m => m.name),
      ...retailItems.map(m => m.name),
    ].join(', ')

    const payload = {
      customer_id: customerId,
      date,
      services: allSelectedStr || '',
      visit_type: visitType,
      has_removal: removalOptions,
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

  // 来客区分ハンドラ（iOS対応）
  const handleNew = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation(); setVisitType('new')
  }
  const handleRepeat = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); e.stopPropagation(); setVisitType('repeat')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 12,
    padding: '10px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* 日付 */}
      <div>
        <label style={labelStyle}>📅 日付</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} />
      </div>

      {/* 来客区分 */}
      <div>
        <label style={labelStyle}>👤 来客区分</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <div role="button" tabIndex={0}
            onClick={handleNew} onTouchEnd={handleNew}
            style={{ ...tapStyle, flex: 1, padding: '12px 0', borderRadius: 12, border: visitType === 'new' ? '2px solid #f472b6' : '2px solid #e5e7eb', background: visitType === 'new' ? '#fdf2f8' : '#fff', color: visitType === 'new' ? '#be185d' : '#6b7280', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
            新規
          </div>
          <div role="button" tabIndex={0}
            onClick={handleRepeat} onTouchEnd={handleRepeat}
            style={{ ...tapStyle, flex: 1, padding: '12px 0', borderRadius: 12, border: visitType === 'repeat' ? '2px solid #f472b6' : '2px solid #e5e7eb', background: visitType === 'repeat' ? '#fdf2f8' : '#fff', color: visitType === 'repeat' ? '#be185d' : '#6b7280', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>
            リピート
          </div>
        </div>
      </div>

      {/* 付け替えオフ（4項目・複数選択可） */}
      <div>
        <label style={labelStyle}>🪄 付け替えオフ　<span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>（複数選択可）</span></label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {REMOVAL_OPTIONS.map(opt => {
            const selected = removalOptions.includes(opt)
            return (
              <div key={opt} role="button" tabIndex={0}
                onClick={() => toggleRemoval(opt)}
                onTouchEnd={e => { e.preventDefault(); toggleRemoval(opt) }}
                style={{ ...tapStyle, padding: '10px 16px', borderRadius: 20, border: selected ? '2px solid #f472b6' : '1px solid #e5e7eb', background: selected ? '#fdf2f8' : '#f9fafb', color: selected ? '#be185d' : '#374151', fontSize: 13, fontWeight: selected ? 600 : 400 }}>
                {opt}
              </div>
            )
          })}
        </div>
      </div>

      {/* 施術メニュー */}
      <div>
        <label style={labelStyle}>💅 施術メニュー</label>
        <MenuSection label="メニューを選ぶ" allItems={allMenus} selected={menuItems}
          onToggle={toggleItem(setMenuItems)} onQtyChange={changeQty(setMenuItems)} onRemove={removeItem(setMenuItems)} />
      </div>

      {/* オプション */}
      <div>
        <label style={labelStyle}>✨ オプション</label>
        <MenuSection label="オプションを選ぶ" allItems={allOptions} selected={optionItems}
          onToggle={toggleItem(setOptionItems)} onQtyChange={changeQty(setOptionItems)} onRemove={removeItem(setOptionItems)} />
      </div>

      {/* 店販 */}
      <div>
        <label style={labelStyle}>🛍 店販</label>
        <MenuSection label="店販を選ぶ" allItems={allRetails} selected={retailItems}
          onToggle={toggleItem(setRetailItems)} onQtyChange={changeQty(setRetailItems)} onRemove={removeItem(setRetailItems)} />
      </div>

      {/* 割引 */}
      <div>
        <label style={labelStyle}>🎁 割引</label>
        <MenuSection label="割引を選ぶ" allItems={allDiscounts} selected={discountItems}
          onToggle={toggleItem(setDiscountItems)} onQtyChange={changeQty(setDiscountItems)} onRemove={removeItem(setDiscountItems)} />
      </div>

      {/* 合計・明細 */}
      {allSelected.length > 0 && (
        <div style={{ background: '#fdf2f8', borderRadius: 12, padding: 16, border: '1px solid #fbcfe8' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>💰 明細</p>
          {menuItems.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
              <span>{i.name} × {i.qty}</span><span>¥{((Number(i.price)||0) * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {optionItems.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
              <span>{i.name} × {i.qty}</span><span>¥{((Number(i.price)||0) * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {retailItems.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4b5563', marginBottom: 4 }}>
              <span>{i.name} × {i.qty}</span><span>¥{((Number(i.price)||0) * i.qty).toLocaleString()}</span>
            </div>
          ))}
          {discountItems.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#ef4444', marginBottom: 4 }}>
              <span>{i.name} × {i.qty}</span><span>−¥{((Number(i.price)||0) * i.qty).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #fbcfe8', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1f2937' }}>
            <span>合計</span><span>¥{total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* 使用カラー */}
      <div>
        <label style={labelStyle}>🎨 使用カラー</label>
        <input type="text" value={colors} onChange={e => setColors(e.target.value)}
          placeholder="例: OPI #52, ジェルネイル ピンク系" style={inputStyle} />
      </div>

      {/* 担当スタッフ */}
      {staffList.length > 0 && (
        <div>
          <label style={labelStyle}>👩‍💼 担当スタッフ</label>
          <select value={staffId} onChange={e => setStaffId(e.target.value)} style={inputStyle}>
            <option value="">選択してください</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* 備考 */}
      <div>
        <label style={labelStyle}>📝 備考</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="特記事項があれば入力してください"
          style={{ ...inputStyle, resize: 'none' }} />
      </div>

      {/* 施術写真 */}
      <div>
        <label style={labelStyle}>📸 施術写真</label>
        <button type="button" onClick={() => fileInputRef.current?.click()}
          style={{ ...tapStyle, width: '100%', padding: '12px 0', border: '2px dashed #d1d5db', borderRadius: 12, fontSize: 14, color: '#6b7280', background: '#fff' }}>
          {uploading ? 'アップロード中...' : '写真を追加する'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
        {photoUrls.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
            {photoUrls.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                <button type="button" onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ ...tapStyle, position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 保存ボタン */}
      <button type="submit" disabled={loading}
        style={{ ...tapStyle, width: '100%', padding: '14px 0', background: loading ? '#f9a8d4' : '#ec4899', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
        {loading ? '保存中...' : treatmentId ? '更新する' : '施術記録を保存する'}
      </button>

    </form>
  )
}
