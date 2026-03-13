import { createClient } from '@/lib/supabase/server'

export interface AdminUser {
  id: string
  auth_id: string
  email: string
  name: string
  role: 'super' | 'admin'
  permissions: string[]
}

export const PERMISSION_MAP: Record<string, string> = {
  '/admin/orders': 'orders',
  '/admin/goods': 'goods',
  '/admin/categories': 'categories',
  '/admin/members': 'members',
  '/admin/coupons': 'coupons',
  '/admin/reviews': 'reviews',
  '/admin/faq': 'faq',
  '/admin/inquiries': 'inquiries',
  '/admin/notices': 'notices',
  '/admin/banners': 'banners',
  '/admin/time-sales': 'time_sales',
  '/admin/popups': 'popups',
  '/admin/stats': 'stats',
  '/admin/email': 'email',
  '/admin/notifications': 'notifications',
  '/admin/settings': 'settings',
  '/admin/admins': 'admins',
  '/admin/cart-abandonment': 'orders',
  '/admin/referral': 'members',
}

export const ALL_PERMISSIONS = [
  { key: 'orders', label: '주문 관리' },
  { key: 'goods', label: '상품 관리' },
  { key: 'categories', label: '카테고리 관리' },
  { key: 'members', label: '회원 관리' },
  { key: 'coupons', label: '쿠폰 관리' },
  { key: 'reviews', label: '리뷰 관리' },
  { key: 'faq', label: '자주 묻는 질문' },
  { key: 'inquiries', label: '1:1 문의' },
  { key: 'notices', label: '공지사항' },
  { key: 'banners', label: '배너 관리' },
  { key: 'time_sales', label: '타임세일' },
  { key: 'popups', label: '팝업 관리' },
  { key: 'stats', label: '통계' },
  { key: 'email', label: '이메일 발송' },
  { key: 'notifications', label: '알림 설정' },
  { key: 'settings', label: '쇼핑몰 설정' },
]

/** 현재 로그인한 관리자 정보 조회 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, auth_id, email, name, role, permissions')
    .eq('auth_id', user.id)
    .single()

  return admin ?? null
}

/** 특정 권한이 있는지 체크 */
export function hasPermission(admin: AdminUser, permission: string): boolean {
  if (admin.role === 'super') return true
  return admin.permissions.includes(permission)
}

/** 메뉴 경로에 접근 가능한지 체크 */
export function canAccessPath(admin: AdminUser, path: string): boolean {
  if (admin.role === 'super') return true
  if (path === '/admin/dashboard') return true
  const permission = Object.entries(PERMISSION_MAP).find(([prefix]) => path.startsWith(prefix))?.[1]
  if (!permission) return false
  return admin.permissions.includes(permission)
}
