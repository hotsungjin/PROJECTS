'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function IconHome({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#968774" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V10.5Z" stroke="#333" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconCategory({ active }: { active: boolean }) {
  const color = active ? '#968774' : '#333'
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="2.5" rx="1" fill={color} />
      <rect x="3" y="11" width="18" height="2.5" rx="1" fill={color} />
      <rect x="3" y="17" width="18" height="2.5" rx="1" fill={color} />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSearch({ active }: { active: boolean }) {
  const color = active ? '#968774' : '#333'
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="2.5" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="1.8" />
      <line x1="15.5" y1="15.5" x2="21" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconWishlist({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#968774" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#333" strokeWidth="1.5" />
    </svg>
  )
}

function IconMypage({ active }: { active: boolean }) {
  return active ? (
    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4.5" fill="#968774" />
      <path d="M4 20c0-3.5 3.58-6 8-6s8 2.5 8 6" fill="#968774" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke="#333" strokeWidth="1.8" />
      <path d="M4.5 20.5c0-3.5 3.58-6.5 7.5-6.5s7.5 3 7.5 6.5" stroke="#333" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const NAV_ITEMS = [
  { key: 'home',     href: '/',                      icon: IconHome,     label: '홈' },
  { key: 'category', href: '/categories',              icon: IconCategory, label: '카테고리' },
  { key: 'search',   href: '/goods?q=',              icon: IconSearch,   label: '검색' },
  { key: 'wishlist', href: '/mypage/wishlist',        icon: IconWishlist, label: '관심상품' },
  { key: 'mypage',   href: '/mypage',                icon: IconMypage,   label: '마이페이지' },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (key: string) => {
    if (key === 'home') return pathname === '/'
    if (key === 'category') return pathname === '/categories'
    if (key === 'wishlist') return pathname === '/mypage/wishlist'
    if (key === 'mypage') return pathname === '/mypage'
    return false
  }

  return (
    <nav
      data-bottom-nav
      className="sticky bottom-0 z-50 bg-white flex justify-evenly shadow-[0_-1px_6px_rgba(0,0,0,0.06)]"
      style={{ borderTop: '1px solid #ebebeb', height: '52px' }}
    >
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const active = isActive(item.key)
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <Icon active={active} />
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? '#968774' : '#aaa' }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
