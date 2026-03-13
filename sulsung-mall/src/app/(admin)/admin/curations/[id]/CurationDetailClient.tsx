'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Search, X, GripVertical } from 'lucide-react'
import Link from 'next/link'

interface Goods {
  id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  thumbnail_url: string | null
  status: string
}

interface CurationItem {
  id: string
  sort_order: number
  goods_id: string
  goods: Goods
}

export default function CurationDetailClient({ curationId }: { curationId: string }) {
  const [curation, setCuration] = useState<any>(null)
  const [items, setItems] = useState<CurationItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Goods[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changed, setChanged] = useState(false)

  useEffect(() => { load() }, [curationId])

  async function load() {
    const res = await fetch(`/api/v1/admin/curations/${curationId}`)
    const data = await res.json()
    setCuration(data.curation)
    setItems(data.items ?? [])
    setChanged(false)
  }

  const searchGoods = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/v1/admin/goods?q=${encodeURIComponent(searchQuery)}&limit=20`)
    const { data } = await res.json()
    setSearchResults(data ?? [])
    setSearching(false)
  }, [searchQuery])

  function addGoods(goods: Goods) {
    if (items.some(i => i.goods_id === goods.id)) return
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      sort_order: prev.length,
      goods_id: goods.id,
      goods,
    }])
    setChanged(true)
  }

  function removeGoods(goodsId: string) {
    setItems(prev => prev.filter(i => i.goods_id !== goodsId))
    setChanged(true)
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= items.length) return
    const arr = [...items]
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    setItems(arr)
    setChanged(true)
  }

  function moveItemTo(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= items.length) return
    const arr = [...items]
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    setItems(arr)
    setChanged(true)
  }

  function addAllSearchResults() {
    const newItems = searchResults.filter(g => !selectedIds.has(g.id))
    if (newItems.length === 0) return
    setItems(prev => [
      ...prev,
      ...newItems.map((g, i) => ({
        id: crypto.randomUUID(),
        sort_order: prev.length + i,
        goods_id: g.id,
        goods: g,
      }))
    ])
    setChanged(true)
  }

  async function handleSave() {
    setSaving(true)
    const goods_ids = items.map(i => i.goods_id)
    const res = await fetch(`/api/v1/admin/curations/${curationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goods_ids }),
    })
    if (res.ok) {
      setChanged(false)
      alert('저장되었습니다.')
    }
    setSaving(false)
  }

  if (!curation) return <div className="p-6 text-gray-400">로딩 중...</div>

  const selectedIds = new Set(items.map(i => i.goods_id))

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/curations" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{curation.name}</h1>
          <p className="text-sm text-gray-500">큐레이션 상품 관리 · {items.length}개 상품</p>
        </div>
        {changed && (
          <button onClick={handleSave} disabled={saving}
            className="ml-auto bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50">
            {saving ? '저장 중...' : '저장'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 상품 검색 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">상품 검색</h3>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchGoods()}
                placeholder="상품명 검색"
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <button onClick={searchGoods}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700">
              검색
            </button>
          </div>

          {searchResults.length > 0 && searchResults.some(g => !selectedIds.has(g.id)) && (
            <button onClick={addAllSearchResults}
              className="w-full mb-3 py-2 border border-green-600 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition">
              전체 추가 ({searchResults.filter(g => !selectedIds.has(g.id)).length}개)
            </button>
          )}

          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {searching && <p className="text-sm text-gray-400 py-4 text-center">검색 중...</p>}
            {searchResults.map(g => (
              <div key={g.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${selectedIds.has(g.id) ? 'bg-green-50 opacity-60' : 'hover:bg-gray-50 cursor-pointer'}`}
                onClick={() => !selectedIds.has(g.id) && addGoods(g)}>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {g.thumbnail_url && <img src={g.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{g.name}</p>
                  <p className="text-xs text-gray-500">
                    {g.sale_price
                      ? <><span className="line-through">{g.price.toLocaleString()}</span> → <span className="text-red-600 font-medium">{g.sale_price.toLocaleString()}원</span></>
                      : <>{g.price.toLocaleString()}원</>
                    }
                  </p>
                </div>
                {selectedIds.has(g.id)
                  ? <span className="text-xs text-green-600 font-medium flex-shrink-0">추가됨</span>
                  : <span className="text-xs text-blue-600 font-medium flex-shrink-0">+ 추가</span>
                }
              </div>
            ))}
            {!searching && searchResults.length === 0 && searchQuery && (
              <p className="text-sm text-gray-400 py-4 text-center">검색 결과가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 오른쪽: 선택된 상품 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            선택된 상품 ({items.length}개)
          </h3>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {items.map((item, idx) => (
              <div key={item.goods_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group">
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-[10px]">▲</button>
                  <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}
                    className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-[10px]">▼</button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={items.length}
                  value={idx + 1}
                  onChange={e => {
                    const target = parseInt(e.target.value, 10)
                    if (!isNaN(target) && target >= 1 && target <= items.length) {
                      moveItemTo(idx, target - 1)
                    }
                  }}
                  className="w-8 text-xs text-gray-500 text-center flex-shrink-0 border border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none rounded py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {item.goods?.thumbnail_url && <img src={item.goods.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.goods?.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.goods?.sale_price
                      ? `${item.goods.sale_price.toLocaleString()}원`
                      : `${item.goods?.price?.toLocaleString()}원`
                    }
                  </p>
                </div>
                <button onClick={() => removeGoods(item.goods_id)}
                  className="text-gray-300 hover:text-red-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">
                왼쪽에서 상품을 검색하여 추가하세요.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
