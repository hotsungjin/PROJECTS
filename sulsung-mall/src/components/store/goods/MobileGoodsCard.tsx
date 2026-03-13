'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import CartBottomSheet from './CartBottomSheet'

interface GoodsItem {
  id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  thumbnail_url: string | null
  sale_count?: number
  review_count?: number
}

export default function MobileGoodsCard({ goods }: { goods: GoodsItem; isFirst?: boolean; isLast?: boolean }) {
  const [showSheet, setShowSheet] = useState(false)
  const price = goods.sale_price ?? goods.price
  const discountRate = goods.sale_price
    ? Math.round((1 - goods.sale_price / goods.price) * 100)
    : 0

  return (
    <>
      <div style={{ width: '155px', flexShrink: 0, scrollSnapAlign: 'start' }}>
        <Link href={`/goods/${goods.slug}`} className="block">
          {/* 이미지 — 4:5 비율 */}
          <div
            className="w-full overflow-hidden bg-gray-100 relative"
            style={{ aspectRatio: '4 / 5', borderRadius: '4px' }}
          >
            {goods.thumbnail_url ? (
              <img src={goods.thumbnail_url} alt={goods.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-50">🥩</div>
            )}
            {discountRate > 0 && (
              <span className="absolute top-2 left-2 text-[11px] font-bold text-white px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#968774' }}>
                {discountRate}%
              </span>
            )}
          </div>
        </Link>

        {/* 담기 버튼 */}
        <button onClick={() => setShowSheet(true)}
          className="w-full flex items-center justify-center gap-1.5"
          style={{
            border: '1px solid #e5e5e5',
            borderRadius: '4px',
            color: '#555',
            marginTop: '6px',
            height: '32px',
            fontSize: '13px',
            fontWeight: 500,
          }}>
          <ShoppingCart style={{ width: 14, height: 14 }} />
          담기
        </button>

        {/* 상품 정보 */}
        <Link href={`/goods/${goods.slug}`} className="block" style={{ marginTop: '8px' }}>
          <p className="line-clamp-2" style={{ fontSize: '14px', lineHeight: '1.35', color: '#333' }}>
            {goods.name}
          </p>

          <div style={{ marginTop: '4px' }}>
            {goods.sale_price && (
              <p style={{ fontSize: '12px', color: '#aaa', textDecoration: 'line-through' }}>
                {goods.price.toLocaleString()}원
              </p>
            )}
            <div className="flex items-center gap-1">
              {discountRate > 0 && (
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#e84a3b' }}>
                  {discountRate}%
                </span>
              )}
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#222' }}>
                {price.toLocaleString()}원
              </span>
            </div>
          </div>

          {/* 리뷰 수 */}
          {((goods.review_count ?? goods.sale_count ?? 0) > 0) && (
            <p className="flex items-center gap-0.5" style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>
              <span>💬</span> {(goods.review_count ?? goods.sale_count ?? 0).toLocaleString()}+
            </p>
          )}
        </Link>
      </div>

      {/* 장바구니 바텀시트 */}
      {showSheet && (
        <CartBottomSheet goods={goods} onClose={() => setShowSheet(false)} />
      )}
    </>
  )
}
