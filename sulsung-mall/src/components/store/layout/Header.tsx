'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, ShoppingCart, User, X } from 'lucide-react'

const NAV_TABS = [
  { label: '추천', href: '/' },
  { label: '베스트', href: '/goods?sort=sale_count' },
  { label: '신상품', href: '/goods?sort=newest' },
  { label: '파격특가', href: '/goods?curation=sale' },
  { label: '오늘도설성', href: '/goods?curation=daily' },
]

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [trending, setTrending] = useState<{ keyword: string; count: number }[]>([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/v1/cart')
      .then(r => r.json())
      .then(j => setCartCount((j.items ?? j.data ?? []).length))
      .catch(() => {})
  }, [])

  // BottomNav 검색 탭 클릭 이벤트 수신
  useEffect(() => {
    const handler = () => setSearchOpen(true)
    window.addEventListener('open-search', handler)
    return () => window.removeEventListener('open-search', handler)
  }, [])

  // 검색 오버레이 열릴 때 급상승 검색어 가져오기
  useEffect(() => {
    if (searchOpen) {
      fetch('/api/v1/search')
        .then(r => r.json())
        .then(j => setTrending(j.keywords ?? []))
        .catch(() => {})
    }
  }, [searchOpen])

  const doSearch = (q: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/goods?q=${encodeURIComponent(q)}`)
    // 검색 로그 기록
    fetch('/api/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: q }),
    }).catch(() => {})
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      doSearch(searchQuery.trim())
    }
  }

  const isMypage = pathname.startsWith('/mypage') || pathname.startsWith('/notice') || pathname.startsWith('/faq')

  return (
    <>
      {/* 상단 헤더 — 마이페이지에서는 숨김 */}
      {!isMypage && (
      <header
        data-store-header
        className="sticky top-0 z-50 w-full bg-white"
        style={{ boxShadow: scrolled ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}
      >
        <div className="flex items-center justify-between h-[52px]" style={{ paddingLeft: '18px', paddingRight: '12px' }}>
          <Link href="/" className="flex items-center">
            <Image src="/images/logo.png" alt="설성목장" width={90} height={26} priority style={{ width: 90, height: 26 }} />
          </Link>
          <div className="flex items-center">
            <Link href="/cart" className="w-10 h-10 flex items-center justify-center relative">
              <ShoppingCart className="w-[24px] h-[24px]" strokeWidth={2.2} style={{ color: '#222' }} />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1 w-[18px] h-[18px] flex items-center justify-center rounded-full text-white font-bold"
                  style={{ backgroundColor: '#968774', fontSize: '10px' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 카테고리 탭 네비게이션 — 마이페이지에서는 숨김 */}
        {!pathname.startsWith('/mypage') && (
          <nav className="flex overflow-x-auto scrollbar-hide shadow-[0_1px_6px_rgba(0,0,0,0.06)]" style={{ paddingLeft: '18px', clipPath: 'inset(0 0 -10px 0)' }}>
            {NAV_TABS.map(tab => {
              const tabUrl = new URL(tab.href, 'http://x')
              const tabSort = tabUrl.searchParams.get('sort')
              const tabCuration = tabUrl.searchParams.get('curation')
              const curSort = searchParams.get('sort')
              const curCuration = searchParams.get('curation')
              const isActive = tab.href === '/'
                ? pathname === '/'
                : pathname === tabUrl.pathname &&
                  (tabSort ? curSort === tabSort : !curSort) &&
                  (tabCuration ? curCuration === tabCuration : !curCuration)
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="flex-shrink-0 px-4 py-3 text-[16px] whitespace-nowrap"
                  style={{
                    color: isActive ? '#968774' : '#333',
                    fontWeight: isActive ? 700 : 400,
                    borderBottom: isActive ? '2.5px solid #968774' : '2.5px solid transparent',
                  }}
                >
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>
      )}

      {/* 검색 오버레이 — 메인 컨테이너 내부 */}
      {searchOpen && createPortal(
        <div className="absolute inset-0 z-[60] bg-white flex flex-col" style={{ position: 'sticky', top: 0, height: '100vh', marginTop: '-100vh' }}>
          {/* 검색바 */}
          <form onSubmit={handleSearch}
            className="flex items-center gap-3 px-4 flex-shrink-0"
            style={{ height: '52px' }}>
            <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery('') }}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div className="flex-1 flex items-center gap-2.5 h-[44px] rounded-full px-4"
              style={{ backgroundColor: '#f5f5f5' }}>
              <Search className="w-5 h-5 flex-shrink-0" style={{ color: '#aaa' }} />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력해 주세요"
                className="flex-1 text-[16px] outline-none bg-transparent" style={{ color: '#333' }} />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#ccc' }}>
                  <X className="w-3 h-3" style={{ color: '#fff' }} />
                </button>
              )}
            </div>
          </form>

          {/* 검색 콘텐츠 */}
          <div className="flex-1 overflow-y-auto bg-white px-5 py-6">
            {/* 추천 검색어 */}
            <h3 className="text-[18px] font-bold mb-4" style={{ color: '#1a1a1a' }}>추천 검색어</h3>
            <div className="flex flex-wrap gap-2.5 mb-10">
              {['한우', '한돈', '간편식', '선물세트', '유제품', '베이비'].map(tag => (
                <button key={tag}
                  onClick={() => doSearch(tag)}
                  className="px-4 py-2 rounded-full text-[15px]"
                  style={{ border: '1px solid #ddd', color: '#555', background: '#fff' }}>
                  {tag}
                </button>
              ))}
            </div>

            {/* 급상승 검색어 */}
            <h3 className="text-[18px] font-bold mb-1" style={{ color: '#1a1a1a' }}>급상승 검색어</h3>
            <p className="text-[13px] mb-5" style={{ color: '#999' }}>최근 1시간 동안 검색 횟수가 급상승했어요</p>

            {trending.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6">
                {trending.map((item, i) => (
                  <button
                    key={item.keyword}
                    onClick={() => doSearch(item.keyword)}
                    className="flex items-center gap-3 py-3 text-left"
                    style={{ borderBottom: '1px solid #f0f0f0' }}
                  >
                    <span className="text-[16px] font-bold w-7 text-center" style={{ color: '#968774' }}>{i + 1}</span>
                    <span className="text-[16px] truncate" style={{ color: '#333' }}>{item.keyword}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[14px] py-4 text-center" style={{ color: '#bbb' }}>아직 검색 데이터가 없습니다</p>
            )}
          </div>
        </div>,
        document.querySelector('.app-scroll-wrapper') ?? document.body
      )}
    </>
  )
}
