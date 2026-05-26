'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Trash2 } from 'lucide-react'
import TreatmentForm from '../../TreatmentForm'

export default function TreatmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const treatmentId = params.tid as string
  const [loading, setLoading] = useState(true)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    supabase.from('treatments').select('id').eq('id', treatmentId).single().then(({ data }) => {
      setExists(!!data)
      setLoading(false)
    })
  }, [treatmentId])

  const handleDelete = async () => {
    if (!confirm('この施術記録を削除しますか？')) return
    await supabase.from('treatments').delete().eq('id', treatmentId)
    router.push(`/customers/${customerId}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">読み込み中...</div>
  if (!exists) return <div className="min-h-screen flex items-center justify-center text-gray-500">記録が見つかりません</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/customers/${customerId}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">施術記録を編集</h1>
          </div>
          <button onClick={handleDelete} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-sm">
            <Trash2 className="w-4 h-4" />
            削除
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <TreatmentForm customerId={customerId} treatmentId={treatmentId} />
        </div>
      </div>
    </div>
  )
}
