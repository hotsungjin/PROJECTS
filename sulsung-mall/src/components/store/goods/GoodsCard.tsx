'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { formatPrice, calcDiscountRate } from '@/utils/format'
import CartBottomSheet from './CartBottomSheet'

interface GoodsCardProps {
  goods: {
    id: string
    name: string
    slug: string
    price: number
    sale_price: number | null
    thumbnail_url: string | null
    sale_count?: number
  }
}

export default function GoodsCard({ goods }: GoodsCardProps) {
  const [showSheet, setShowSheet] = useState(false)
  const discountRate = goods.sale_price ? calcDiscountRate(goods.price, goods.sale_price) : 0
  const displayPrice = goods.sale_price ?? goods.price
  const osulPrice = Math.floor(displayPrice * 0.95)

  return (
    <>
      <div className="block">
        <Link href={`/goods/${goods.slug}`} className="group block">
          {/* 이미지 */}
          <div className="relative bg-gray-100 overflow-hidden mb-2" style={{ aspectRatio: '4 / 5', borderRadius: '4px' }}>
            {goods.thumbnail_url ? (
              <Image
                src={goods.thumbnail_url}
                alt={goods.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {discountRate > 0 && (
              <span className="absolute top-2 left-2 text-white text-[11px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: '#e84a3b' }}>
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
            marginBottom: '6px',
            height: '32px',
            fontSize: '13px',
            fontWeight: 500,
          }}>
          <ShoppingCart style={{ width: 14, height: 14 }} />
          담기
        </button>

        {/* 정보 */}
        <Link href={`/goods/${goods.slug}`} className="block">
          <p className="text-[13px] text-gray-800 font-medium line-clamp-2 mb-1 leading-snug">
            {goods.name}
          </p>
          {discountRate > 0 && (
            <p className="text-[11px] text-gray-400 line-through">{formatPrice(goods.price)}</p>
          )}
          <p className="text-[14px] font-bold" style={{ color: '#333' }}>{formatPrice(displayPrice)}</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#968774' }}>
            오설가 {formatPrice(osulPrice)}
          </p>
        </Link>
      </div>

      {showSheet && (
        <CartBottomSheet goods={goods} onClose={() => setShowSheet(false)} />
      )}
    </>
  )
}
