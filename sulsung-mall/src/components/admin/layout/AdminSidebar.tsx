'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Tag, FolderTree, Layers, Bookmark,
  BarChart2, Image, MessageSquare, Settings, Star, Bell, Clock, Megaphone, ShoppingCart, Mail,
  HelpCircle, MessageCircle, ShieldCheck, ClipboardList, FileText, UserPlus,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { SITE_NAME } from '@/constants'

const MENU = [
  { href: '/admin/dashboard',        icon: LayoutDashboard, label: '대시보드',       permission: null },
  { href: '/admin/orders',           icon: ShoppingBag,     label: '주문 관리',      permission: 'orders' },
  { href: '/admin/goods',            icon: Package,         label: '상품 관리',      permission: 'goods' },
  { href: '/admin/purchases',        icon: ClipboardList,   label: '발주 관리',      permission: 'goods' },
  { href: '/admin/categories',       icon: FolderTree,      label: '카테고리 관리',  permission: 'categories' },
  { href: '/admin/brands',           icon: Bookmark,        label: '브랜드 관리',    permission: 'goods' },
  { href: '/admin/curations',        icon: Layers,          label: '큐레이션 관리', permission: 'goods' },
  { href: '/admin/members',          icon: Users,           label: '회원 관리',      permission: 'members' },
  { href: '/admin/coupons',          icon: Tag,             label: '쿠폰 관리',      permission: 'coupons' },
  { href: '/admin/reviews',          icon: Star,            label: '리뷰 관리',      permission: 'reviews' },
  { href: '/admin/faq',              icon: HelpCircle,      label: '자주 묻는 질문', permission: 'faq' },
  { href: '/admin/inquiries',        icon: MessageCircle,   label: '1:1 문의',       permission: 'inquiries' },
  { href: '/admin/notices',          icon: MessageSquare,   label: '공지사항',       permission: 'notices' },
  { href: '/admin/banners',          icon: Image,           label: '배너 관리',      permission: 'banners' },
  { href: '/admin/time-sales',       icon: Clock,           label: '타임세일',       permission: 'time_sales' },
  { href: '/admin/popups',           icon: Megaphone,       label: '팝업 관리',      permission: 'popups' },
  { href: '/admin/referral',          icon: UserPlus,        label: '추천 관리',      permission: 'members' },
  { href: '/admin/cart-abandonment', icon: ShoppingCart,     label: '이탈 장바구니',  permission: 'orders' },
  { href: '/admin/stats',            icon: BarChart2,       label: '통계',           permission: 'stats' },
  { href: '/admin/email',            icon: Mail,            label: '이메일 발송',    permission: 'email' },
  { href: '/admin/notifications',    icon: Bell,            label: '알림 설정',      permission: 'notifications' },
  { href: '/admin/terms',             icon: FileText,        label: '약관 관리',      permission: 'settings' },
  { href: '/admin/settings',         icon: Settings,        label: '쇼핑몰 설정',   permission: 'settings' },
  { href: '/admin/admins',           icon: ShieldCheck,     label: '관리자 관리',    permission: 'admins' },
]

interface AdminSidebarProps {
  role?: 'super' | 'admin'
  permissions?: string[]
}

export default function AdminSidebar({ role = 'super', permissions = [] }: AdminSidebarProps) {
  const pathname = usePathname()

  const visibleMenu = MENU.filter(item => {
    if (!item.permission) return true // 대시보드는 항상 표시
    if (role === 'super') return true
    if (item.permission === 'admins') return false // 관리자 관리는 super만
    return permissions.includes(item.permission)
  })

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="px-6 py-5 border-b border-gray-700">
        <Link href="/admin/dashboard" className="text-lg font-bold text-green-400">
          {SITE_NAME}
        </Link>
        <p className="text-xs text-gray-400 mt-0.5">
          {role === 'super' ? '최고 관리자' : '관리자'}
        </p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {visibleMenu.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-green-800 text-green-100'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-gray-700">
        <Link href="/" target="_blank" className="text-xs text-gray-400 hover:text-white">
          ← 쇼핑몰 보기
        </Link>
      </div>
    </aside>
  )
}
