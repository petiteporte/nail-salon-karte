'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, CalendarDays, Home, Settings, LogOut, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const links = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/customers', label: '顧客', icon: Users },
    { href: '/calendar', label: '予約', icon: CalendarDays },
    { href: '/analytics', label: '統計', icon: TrendingUp },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pink-100 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-3xl mx-auto flex justify-around md:justify-start md:gap-8 md:px-6 relative">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-4 text-xs md:text-sm font-medium transition-colors ${
                active ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'
              }`}
            >
              <Icon size={22} />
              {label}
            </Link>
          )
        })}

        {/* 設定メニュー */}
        <div className="relative md:ml-auto">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-4 text-xs md:text-sm font-medium text-gray-400 hover:text-pink-400 transition-colors"
          >
            <Settings size={22} />
            設定
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-14 md:bottom-auto md:top-12 right-0 bg-white rounded-2xl shadow-lg border border-pink-100 py-2 w-48 z-50">
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-pink-50"
                >
                  <Settings size={16} className="text-pink-400" />
                  アカウント設定
                </Link>
                <Link
                  href="/admin/staff"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-pink-50"
                >
                  <Users size={16} className="text-pink-400" />
                  スタッフ管理
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-pink-50"
                >
                  <Users size={16} className="text-pink-400" />
                  ログインアカウント
                </Link>
                <Link
                  href="/admin/menus"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-pink-50"
                >
                  <Settings size={16} className="text-pink-400" />
                  メニュー管理
                </Link>
                <hr className="my-1 border-pink-50" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-50 w-full"
                >
                  <LogOut size={16} />
                  ログアウト
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
