'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Appointment } from '@/lib/supabase'
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from 'lucide-react'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState({ customer_id: '', time: '10:00', service: '', notes: '' })
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ time: '', service: '', notes: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  useEffect(() => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = `${year}-${String(month + 1).padStart(2, '0')}-31`
    supabase.from('appointments')
      .select('*, customers(name)')
      .gte('date', start).lte('date', end)
      .order('time')
      .then(({ data }) => setAppointments(data ?? []))

    supabase.from('customers').select('id, name').order('name')
      .then(({ data }) => setCustomers(data ?? []))
  }, [year, month])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date().toISOString().split('T')[0]

  const getDayAppointments = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(a => a.date === dateStr)
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const reloadAppointments = async () => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = `${year}-${String(month + 1).padStart(2, '0')}-31`
    const { data } = await supabase.from('appointments')
      .select('*, customers(name)')
      .gte('date', start).lte('date', end).order('time')
    setAppointments(data ?? [])
  }

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    let customerId = form.customer_id

    // 新規顧客登録
    if (isNewCustomer) {
      if (!newCustomerName.trim()) return
      const { data: newC } = await supabase.from('customers').insert([{
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim() || null,
      }]).select().single()
      if (!newC) return
      customerId = newC.id
      // 顧客リストにも追加
      setCustomers(prev => [...prev, { id: newC.id, name: newC.name }])
    }

    if (!customerId) return
    await supabase.from('appointments').insert([{
      customer_id: customerId,
      date: selectedDate,
      time: form.time,
      service: form.service || null,
      notes: form.notes || null,
    }])
    setShowForm(false)
    setForm({ customer_id: '', time: '10:00', service: '', notes: '' })
    setIsNewCustomer(false)
    setNewCustomerName('')
    setNewCustomerPhone('')
    await reloadAppointments()
  }

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('この予約を取り消しますか？')) return
    setDeletingId(id)
    await supabase.from('appointments').delete().eq('id', id)
    setDeletingId(null)
    await reloadAppointments()
  }

  const startEdit = (apt: any) => {
    setEditingId(apt.id)
    setEditForm({ time: apt.time, service: apt.service ?? '', notes: apt.notes ?? '' })
  }

  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    await supabase.from('appointments').update({
      time: editForm.time,
      service: editForm.service || null,
      notes: editForm.notes || null,
    }).eq('id', editingId)
    setEditingId(null)
    await reloadAppointments()
  }

  const selectedAppointments = selectedDate
    ? appointments.filter(a => a.date === selectedDate)
    : []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-700">予約カレンダー</h1>

      {/* 月ナビ */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
        <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-2 text-gray-400 hover:text-pink-400">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-gray-700">{year}年{month + 1}月</span>
        <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-2 text-gray-400 hover:text-pink-400">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
        <div className="grid grid-cols-7 mb-2">
          {['日','月','火','水','木','金','土'].map((d, i) => (
            <div key={d} className={`text-center text-xs font-bold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayApts = getDayAppointments(day)
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const dow = (firstDay + i) % 7
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`rounded-xl py-2 text-center transition-colors ${
                  isSelected ? 'bg-pink-400 text-white' :
                  isToday ? 'bg-pink-50 text-pink-500 font-bold' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-sm ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : isSelected ? 'text-white' : 'text-gray-700'} ${isSelected ? 'text-white' : ''}`}>{day}</span>
                {dayApts.length > 0 && (
                  <div className="flex justify-center mt-0.5">
                    {dayApts.slice(0, 3).map((_, j) => (
                      <span key={j} className={`w-1 h-1 rounded-full mx-0.5 ${isSelected ? 'bg-white' : 'bg-pink-400'}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 選択日の予約 */}
      {selectedDate && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">{selectedDate.replace(/-/g, '/')} の予約</h2>
            <button
              onClick={() => setShowForm(true)}
              className="bg-pink-400 hover:bg-pink-500 text-white rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"
            >
              <Plus size={14} />追加
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddAppointment} className="bg-pink-50 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-600">予約を追加</span>
                <button type="button" onClick={() => { setShowForm(false); setIsNewCustomer(false); setNewCustomerName(''); setNewCustomerPhone('') }}>
                  <X size={16} className="text-gray-400" />
                </button>
              </div>

              {/* 既存 / 新規 切り替え */}
              <div className="flex gap-1 bg-white rounded-xl p-1 border border-pink-100">
                <button type="button"
                  onClick={() => setIsNewCustomer(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${!isNewCustomer ? 'bg-pink-400 text-white' : 'text-gray-400 hover:text-pink-400'}`}>
                  既存顧客
                </button>
                <button type="button"
                  onClick={() => setIsNewCustomer(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${isNewCustomer ? 'bg-pink-400 text-white' : 'text-gray-400 hover:text-pink-400'}`}>
                  新規顧客
                </button>
              </div>

              {isNewCustomer ? (
                <>
                  <input type="text" placeholder="お名前 *" value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300" />
                  <input type="tel" placeholder="電話番号（任意）" value={newCustomerPhone}
                    onChange={e => setNewCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300" />
                </>
              ) : (
                <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                  className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none">
                  <option value="">顧客を選択</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}

              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none" />
              <input type="text" placeholder="施術内容" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none" />
              <button type="submit"
                disabled={isNewCustomer ? !newCustomerName.trim() : !form.customer_id}
                className="w-full bg-pink-400 hover:bg-pink-500 disabled:bg-pink-200 text-white rounded-xl py-2 text-sm font-bold">
                保存
              </button>
            </form>
          )}

          {selectedAppointments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">予約はありません</p>
          ) : (
            <ul className="space-y-2">
              {selectedAppointments.map(apt => (
                <li key={apt.id} className="border-b border-gray-50 last:border-0 py-2">
                  {editingId === apt.id ? (
                    /* ── 編集フォーム ── */
                    <form onSubmit={handleEditAppointment} className="bg-pink-50 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-600">予約を変更</span>
                        <button type="button" onClick={() => setEditingId(null)}>
                          <X size={14} className="text-gray-400" />
                        </button>
                      </div>
                      <input type="time" value={editForm.time}
                        onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                        className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300" />
                      <input type="text" placeholder="施術内容" value={editForm.service}
                        onChange={e => setEditForm(f => ({ ...f, service: e.target.value }))}
                        className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300" />
                      <input type="text" placeholder="メモ" value={editForm.notes}
                        onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full bg-white border border-pink-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-300" />
                      <div className="flex gap-2">
                        <button type="submit"
                          className="flex-1 bg-pink-400 hover:bg-pink-500 text-white rounded-xl py-2 text-xs font-bold">
                          保存
                        </button>
                        <button type="button" onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl py-2 text-xs font-bold">
                          キャンセル
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── 通常表示 ── */
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-pink-400 w-14 shrink-0">{apt.time}</span>
                      <div className="flex-1 min-w-0">
                        {apt.customer_id ? (
                          <Link href={`/customers/${apt.customer_id}`} className="text-sm font-bold text-pink-500 hover:underline">
                            {(apt as any).customers?.name}
                          </Link>
                        ) : (
                          <p className="text-sm text-gray-700">{(apt as any).customers?.name}</p>
                        )}
                        {apt.service && <p className="text-xs text-gray-400">{apt.service}</p>}
                        {apt.notes && <p className="text-xs text-gray-300 mt-0.5">{apt.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => startEdit(apt)}
                          className="text-gray-300 hover:text-pink-400 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDeleteAppointment(apt.id)}
                          disabled={deletingId === apt.id}
                          className="text-gray-300 hover:text-red-400 disabled:opacity-40 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
