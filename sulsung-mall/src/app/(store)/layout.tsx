import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import Header from '@/components/store/layout/Header'
import Footer from '@/components/store/layout/Footer'
import BottomNav from '@/components/store/layout/BottomNav'
import PcBrandingSidebar from '@/components/store/layout/PcBrandingSidebar'
import { SITE_NAME, SITE_DESCRIPTION } from '@/constants'

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#F9F9F9]">
      <main className="mx-auto h-full max-w-[480px] md:flex md:max-w-[960px] md:gap-[120px]">
        {/* PC 좌측: 브랜딩 사이드바 */}
        <PcBrandingSidebar />

        {/* 우측: 모바일 앱 뷰 — 스크롤바가 바깥 테두리에 위치 */}
        <div className="app-scroll-wrapper relative h-full w-full max-w-[480px] overflow-y-auto overscroll-none md:w-[480px]">
          <div className="relative flex min-h-full flex-col bg-white">
            <Suspense><Header /></Suspense>
            <div className="flex-1">
              {children}
              <div className="pb-[52px]" style={{ backgroundColor: '#f5f5f5' }}>
                <Footer />
              </div>
            </div>
            <BottomNav />
          </div>
        </div>
      </main>
    </div>
  )
}
