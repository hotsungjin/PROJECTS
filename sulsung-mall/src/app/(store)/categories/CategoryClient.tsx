'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Category {
  id: number
  name: string
  slug: string
  image_url: string | null
  sort_order: number
  parent_id: number | null
}

export default function CategoryClient({
  parents,
  children,
}: {
  parents: Category[]
  children: Category[]
}) {
  const [activeId, setActiveId] = useState<number | null>(parents[0]?.id ?? null)

  const activeParent = parents.find(p => p.id === activeId)
  const activeChildren = children.filter(c => c.parent_id === activeId)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fff' }}>
      {/* 카테고리 페이지에서 푸터 숨김 */}
      <style>{`[data-store-footer] { display: none !important; }`}</style>
      {/* 헤더 */}
      <div className="px-4 py-3 border-b" style={{ borderColor: '#eee' }}>
        <h1 className="text-[17px] font-bold" style={{ color: '#333' }}>카테고리</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 대분류 */}
        <div
          className="overflow-y-auto flex-shrink-0"
          style={{
            width: '110px',
            backgroundColor: '#f7f5f2',
            borderRight: '1px solid #eee',
          }}
        >
          {parents.map(cat => {
            const isActive = cat.id === activeId
            return (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className="w-full text-left px-3 py-4 relative"
                style={{
                  backgroundColor: isActive ? '#fff' : 'transparent',
                  borderLeft: isActive ? '3px solid #968774' : '3px solid transparent',
                }}
              >
                <span
                  className="text-[13px] leading-tight block"
                  style={{
                    color: isActive ? '#968774' : '#666',
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  {cat.name}
                </span>
              </button>
            )
          })}
        </div>

        {/* 우측: 소분류 */}
        <div className="flex-1 overflow-y-auto">
          {activeParent && (
            <>
              {/* 대분류 전체보기 헤더 */}
              <Link
                href={`/goods?category=${activeParent.slug}`}
                className="flex items-center gap-3 px-4 py-4 border-b"
                style={{ borderColor: '#f0f0f0' }}
              >
                {activeParent.image_url ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={activeParent.image_url}
                      alt={activeParent.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#f3f0ed' }}
                  >
                    <span className="text-[18px]">🥩</span>
                  </div>
                )}
                <span className="text-[15px] font-bold flex-1" style={{ color: '#333' }}>
                  {activeParent.name}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6l6 6-6 6" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* 소분류 리스트 */}
              {activeChildren.length > 0 ? (
                <div>
                  {activeChildren.map(child => (
                    <Link
                      key={child.id}
                      href={`/goods?category=${child.slug}`}
                      className="flex items-center justify-between px-4 py-3.5 border-b"
                      style={{ borderColor: '#f5f5f5' }}
                    >
                      <span className="text-[14px]" style={{ color: '#333' }}>
                        {child.name}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 6l6 6-6 6" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-[13px]" style={{ color: '#aaa' }}>하위 카테고리가 없습니다.</p>
                  <Link
                    href={`/goods?category=${activeParent.slug}`}
                    className="inline-block mt-3 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
                    style={{ backgroundColor: '#968774' }}
                  >
                    전체 상품 보기
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
