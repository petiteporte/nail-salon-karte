import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Customer = {
  id: string
  name: string
  furigana: string | null
  phone: string | null
  email: string | null
  birthday: string | null
  allergies: string | null
  notes: string | null
  caution: boolean
  caution_reason: string | null
  created_at: string
}

export type Treatment = {
  id: string
  customer_id: string
  date: string
  services: string
  colors: string | null
  notes: string | null
  amount: number | null
  photo_url: string | null
  staff_name: string | null
  is_new_customer: boolean | null
  created_at: string
}

export type Appointment = {
  id: string
  customer_id: string
  customer?: Customer
  date: string
  time: string
  service: string | null
  notes: string | null
  created_at: string
}
