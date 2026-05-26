'use client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TreatmentForm from '../../TreatmentForm'

export default function NewTreatmentPage() {
  const params = useParams()
  const customerId = params.id as string

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/customers/${customerId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">施術記録を追加</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <TreatmentForm customerId={customerId} />
        </div>
      </div>
    </div>
  )
}
